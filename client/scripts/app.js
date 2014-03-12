var app = window.app;
var tempater = window.templater;

/*****************************************************************************/
/* TEMPLATER                                                                 */
/*****************************************************************************/
templater = {
  run:function(object, pattern){
    _.each(object, function(value, key){
      value = templater.escape(value);
      pattern = pattern.replace(RegExp('{{'+key+'}}','g'), value);
    });
    return pattern;
  },
  escape: function(str) {
    var entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': '&quot;',
      "'": '&#39;',
      "/": '&#x2F;'
    };
    return String(str).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }
};

/*****************************************************************************/
/* APP                                                                       */
/*****************************************************************************/
app = {
  /*****************************************************************************/
  /* CONFIG                                                                    */
  /*****************************************************************************/
  roomname: "4chan",
  username: 'Guest',
  url: 'https://api.parse.com/1/classes/chatterbox',
  roomlasttime: {} ,
  messageTimeStamp: "2011-03-11T09:34:08.256Z",
  spam: ["Dinosaur Attack", "Table Attack", "Name Attack", "Room Attack"],
  parseLimit:800,

  /*****************************************************************************/
  /* INIT */
  /*****************************************************************************/
  init: function(){
    app.event();
    app.viewSpam();
    app.fetch({roomname:app.roomname});
    app.fetch({callback:app.viewRoom});
    // INTERVAL 
    setInterval(function(){
      app.fetch({roomname:app.roomname});
    }, 1000);
    setInterval(function(){
      app.fetch({callback:app.viewRoom});
    }, 1000);
  },

  /*****************************************************************************/
  /* AJAX */
  /*****************************************************************************/
  json:function(httpType){
    return { 
      url: app.url, 
      contentType: 'application/json', 
      type: httpType,
      data: {order:"-createdAt",limit:app.parseLimit},
      error: function (data) {console.error('chatterbox: Failed '+httpType);},
      success: function (data) {console.log('chatterbox: '+httpType+' OK');}
    };
  },

  send: function(aMessage){
    var ajaxJson = app.json('POST');
    ajaxJson['data'] = JSON.stringify({'username':app.username, 'text': aMessage, 'roomname': app.roomname});
    $.ajax(ajaxJson);
  },

  fetch:function(arg){
    var ajaxJson = app.json('GET');
    if(arg['callback']){ // GET CHAT ROOM LIST 
      arg['callback'] = arg['callback'] || function(item){console.log(item)}; 
      
      ajaxJson['success'] = function (data) {
        var roomList = _.filter(_.uniq(_.pluck(data.results, 'roomname')), function(item){
          return !!item;
        });
        arg['callback'](roomList);
        _.each(data.results, function(item){
          if(!app.roomlasttime[item.roomname] || (new Date(app.roomlasttime[item.roomname])) < (new Date(item.createdAt))){
            app.roomlasttime[item.roomname] = item.createdAt;
            console.log("Updated timestamp", item.roomname, new Date(app.roomlasttime[item.roomname]), new Date(item.createdAt));
          }
        });
      }
    } else { // GET MESSAGE 
      if(arg['doRefresh']){
        app.messageTimeStamp = "2011-03-11T09:34:08.256Z";
      } 
      ajaxJson['data']['where'] = JSON.stringify({"roomname":arg['roomname']});
      ajaxJson['success'] = function (data) { 
        var results = _.filter(data.results, function(item){
          item.username += " ("+item.roomname+")";
          return (new Date(item.createdAt)) > (new Date(app.messageTimeStamp));
        });
        if(results.length > 0 && arg['roomname'] === app.roomname){
          app.messageTimeStamp = results[0].createdAt;
          app.viewMessage(results, arg['doRefresh']); 
        }
      };
    }
    $.ajax(ajaxJson);
  },

  /*****************************************************************************/
  /* VIEW                                                                      */
  /*****************************************************************************/

  viewSpam:function(){
    $('#sidebar #roomlist').html('');
    _.each(app.spam, function(item, i){
      $("#sidebarRight").append($("<li class='macro'></li>").text(item));
    });
    app.eventSpam();
  },

  viewMessage:function(messages, doRefresh){
    if(doRefresh){
      $("#chatbox").html("");
    }
    messages.reverse();
    _.each(messages, function(item, i){
      // STERILISE
      var aUsername = item.username || 'guest';
      var aMessage = item.text || 'default text';
      var createdAt = moment(item.createdAt).fromNow() || '?';

      // CONCATENATE TEMPLATE
      var template = "<img src='images/spy.png' height='13'/> ";
      template += "<span class='username'>{{USERNAME}}</span>";
      template += "<span class='message'>{{MESSAGE}}</span>";
      template += "<span class='date'>{{DATE}}</span>";

      // CALL TO ENGINE
      var $node = $("<div class='chatMessage'></div>").html(templater.run({
        USERNAME: aUsername,
        MESSAGE: aMessage,
        DATE: createdAt
      }, template));
      
      $("#chatbox").prepend($node);
    });
  },

  viewRoom: function(rooms){
    $('#sidebar #roomlist').html('');
    _.each(rooms, function(room, i){
      $("#sidebar #roomlist").append($("<li class='roomname'></li>").text(room));
    });
    app.eventRoom();
  },

  /*****************************************************************************/
  /* EVENT */
  /*****************************************************************************/
  eventRoom:function(){
    $("li.roomname").on('click', function(){
      app.roomname = $(this).text();
      app.fetch({roomname:app.roomname, doRefresh: true});
      $('input[name=roomname]').val(app.roomname);
    });
  },
  eventSpam:function(){
    $("li.macro").on('click', function(){
      var text = $(this).text();
      if(text === "Dinosaur Attack"){
        for(var i = 0; i<10; i++){
          var random = Math.floor(Math.random()*70);
          for(var str = "Dino Attack!!!!!!!!!!!!!", j = 0; j<random; j++, str += "!");
          app.send(str);
        }
      }else if(text === "Table Attack"){
        for(var i = 0; i<10; i++){
          app.send("(╯°□°）╯︵ ┻━┻");
        }
      }else if(text === "Name Attack"){
        var oldUser = app.username;
        for(var i = 0; i<10; i++){

          app.username = oldUser + Math.floor(Math.random()*1000);
          app.send("┻━┻︵ \\(°□°)/ ︵ ┻━┻");
        }
        app.username = oldUser;
      }else if(text === "Room Attack"){
        var oldRoom = app.roomname;
        for(var i = 0; i<10; i++){
          app.roomname = oldRoom + Math.floor(Math.random()*1000);
          app.send("|̲̲̲͡͡͡ ̲▫̲͡ ̲̲̲͡͡π̲̲͡͡ ̲̲͡▫̲̲͡͡ ̲|̡̡̡ ̡ ̴̡ı̴̡̡ ̡͌l̡ ̴̡ı̴̴̡ ̡l̡*̡̡ ̴̡ı̴̴̡ ̡̡͡|̲̲̲͡͡͡ ̲▫̲͡ ̲̲̲͡͡π̲̲͡͡ ̲̲͡▫̲̲͡͡ |");
        }
        app.roomname = oldRoom;
      }
    });
  },
  event:function(){
    $("input[name=message]").keypress(function(event){
      if(event.keyCode === 13){
        var oldRoomName = ''+app.roomname;
        app.roomname = $('input[name=roomname]').val();
        app.username = $('input[name=username]').val();
        app.send($(this).val());
        $(this).val("");
        app.fetch({roomname:app.roomname});
        app.fetch({callback:app.viewRoom, doRefresh: (app.roomname !== oldRoomName)});
      }
    });
    $("input[name=roomname]").keypress(function(event){
      if(event.keyCode === 13){
        app.roomname = $('input[name=roomname]').val();
        app.fetch({roomname:app.roomname, doRefresh: true});
        app.fetch({callback:app.viewRoom});
      }
    });
  }
};

$(document).ready(function(){
  app.init();
});
