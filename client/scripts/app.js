var app = window.app;
var tempate = window.template;

/*****************************************************************************/
/* TEMPLATING                                                                */
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

  /*****************************************************************************/
  /* INIT */
  /*****************************************************************************/
  init: function(){
    app.event();
  },

  setupSpamMacros:function(){
    $('#sidebar #roomlist').html('');

    _.each(["Dinosaur Attack"], function(item, i){
      $("#sidebarRight").append($("<li class='macro'></li>").text(item));
    });

    $("li.macro").on('click', function(){
      var text = $(this).text();
      if(text === "Dinosaur Attack"){
        console.log("DINOOOOOOO");
        for(var i = 0; i<10; i++){
          var random = Math.floor(Math.random()*70);
          var str = "Dino Attack!!!!!!!!!!!!!";
          for(var j = 0; j<random; j++){
            str += "!";
          }
          app.send(str);
        }
      }
    });
  },

  /*****************************************************************************/
  /* AJAX */
  /*****************************************************************************/
  send: function(aMessage){
    $.ajax({
      url: app.url,
      type: 'POST',
      data: JSON.stringify({
      'username': app.username,
      'text': aMessage,
      'roomname': app.roomname
    }),
      contentType: 'application/json',
      success: function (data) {
        console.log('chatterbox: Message sent');
      },
      error: function (data) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to send message');
      }
    });
  },

  fetch:function(arg){
    var ajaxJson = { 
      url: app.url, 
      type: 'GET', 
      contentType: 'application/json', 
      data: {order:"-createdAt",limit:800},
      error: function (data) {
        console.error('chatterbox: Failed to get message');
      }
    };
    if(arg['callback']){ // GET CHAT ROOM LIST 
      arg['callback'] = arg['callback'] || function(item){console.log(item)}; 
      
      ajaxJson['success'] = function (data) {
        var roomList = _.filter(_.uniq(_.pluck(data.results, 'roomname')), function(item){
          return !!item;
        });
        arg['callback'](roomList);
        _.each(data.results, function(item){
          if(!roomlasttime[item.roomname] || (new Date(roomlasttime[item.roomname])) < (new Date(item.createdAt))){
            roomlasttime[item.roomname] = item.createdAt;
            console.log("Updated timestamp", item.roomname, new Date(roomlasttime[item.roomname]), new Date(item.createdAt));
          }
        });
      }
    } else { // GET MESSAGE 
      if(arg['fullRefresh']){
        messageTimeStamp = "2011-03-11T09:34:08.256Z";
      } 
      ajaxJson['data']['where'] = JSON.stringify({"roomname":arg['roomname']});
      ajaxJson['success'] = function (data) { 
        var results = _.filter(data.results, function(item){
          item.username += " ("+item.roomname+")";
          return (new Date(item.createdAt)) > (new Date(messageTimeStamp));
        });
        if(results.length > 0 && arg['roomname'] === app.roomname){
          messageTimeStamp = results[0].createdAt;
          appendDiv(results, arg['fullRefresh']); 
        }
      };
    }
    $.ajax(ajaxJson);
  },

  /*****************************************************************************/
  /* VIEW                                                                      */
  /*****************************************************************************/
  appendDiv:function(messages, fullRefresh){
    if(fullRefresh){
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

  refreshRoomList: function(rooms){
    $('#sidebar #roomlist').html('');

    _.each(rooms, function(room, i){
      $("#sidebar #roomlist").append($("<li class='roomname'></li>").text(room));
    });
    $("li.roomname").on('click', function(){
      app.roomname = $(this).text();
      app.fetch({roomname:app.roomname, fullRefresh: true});
      $('input[name=roomname]').val(app.roomname);
      
    });
  },

  /*****************************************************************************/
  /* EVENT */
  /*****************************************************************************/
  event:function(){
    $("input[name=message]").keypress(function(event){
      if(event.keyCode === 13){
        var oldRoomName = ''+app.roomname;
        app.roomname = $('input[name=roomname]').val();
        username = $('input[name=username]').val();
        app.send($(this).val());
        $(this).val("");
        app.fetch({roomname:app.roomname});
        app.fetch({callback:app.refreshRoomList, fullRefresh: (app.roomname !== oldRoomName)});
      }
    });
    $("input[name=roomname]").keypress(function(event){
      if(event.keyCode === 13 || event.keyCode === 73){
        app.roomname = $('input[name=roomname]').val();
        app.fetch({roomname:app.roomname, fullRefresh: true});
        app.fetch({callback:app.refreshRoomList});
      }
    });
  }
};

/*****************************************************************************/
var roomlasttime= app.roomlasttime,
  messageTimeStamp= app.messageTimeStamp;
var appendDiv = app.appendDiv;
var setupSpamMacros = app.setupSpamMacros;

$(document).ready(function(){
  app.init();
  setupSpamMacros();
  app.fetch({roomname:app.roomname});
  app.fetch({callback:app.refreshRoomList});
  setInterval(function(){
    app.fetch({roomname:app.roomname});
  }, 1000);
  setInterval(function(){
    app.fetch({callback:app.refreshRoomList});
  }, 1000);
});
