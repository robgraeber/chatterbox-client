/*****************************************************************************/
/* APP                                                                       */
/*****************************************************************************/

var app = window.app;

app = {
  /*****************************************************************************/
  /* CONFIG                                                                    */
  /*****************************************************************************/
  roomName: "4chan",
  userName: 'Guest',
  apiUrl: 'https://api.parse.com/1/classes/chatterbox',
  roomTimeStamp: {} ,
  messageTimeStamp: "2011-03-11T09:34:08.256Z",

  /*****************************************************************************/
  /* INIT */
  /*****************************************************************************/
  init: function(){
    app.event();
  },

  /*****************************************************************************/
  /* ACCESSORS */
  /*****************************************************************************/
  setRoomName:function(name){
    if(roomName !== name){
      roomName = name;
    }
  },

  /*****************************************************************************/
  /* AJAX */
  /*****************************************************************************/
  send: function(aMessage){
    $.ajax({
      url: apiUrl,
      type: 'POST',
      data: JSON.stringify({
      'username': userName,
      'text': aMessage,
      'roomname': roomName
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

  getChatRooms: function(aCallback){
    aCallback = aCallback || function(item){console.log(item)}; 
    $.ajax({
      url: apiUrl,
      type: 'GET',
      contentType: 'application/json',
      data: {order:"-createdAt",limit:200},
      success: function (data) {
        // AIM #1: GET LIST OF LAST ROOMS; RESULT: AN ORDERED ARRAY OF ROOMS 
        var roomList = _.filter(_.uniq(_.pluck(data.results, 'roomname')), function(item){
          return !!item;
        });
        aCallback(roomList);
        // AIM #2: LAST TIME PER ROOM
        _.each(data.results, function(item){
          if(!roomTimeStamp[item.roomname] || (new Date(roomTimeStamp[item.roomname])) < (new Date(item.createdAt))){
            roomTimeStamp[item.roomname] = item.createdAt;
            console.log("Updated timestamp", item.roomname, new Date(roomTimeStamp[item.roomname]), new Date(item.createdAt));
          }
        });
      },
      error: function (data) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to send message');
      }
    })
  },
  getMessages: function(roomName, fullRefresh){
    if(fullRefresh){
      messageTimeStamp = "2011-03-11T09:34:08.256Z";
    }
    $.ajax({
      url: apiUrl,
      type: 'GET',
      contentType: 'application/json',
      data: {
        order:"-createdAt",
        limit:200,
        where:JSON.stringify({"roomname":roomName})
      },
      success: function (data) { 
        var results = _.filter(data.results, function(item){
          item.username += " "+item.roomname;
          return (new Date(item.createdAt)) > (new Date(messageTimeStamp));
        });
        if(results.length > 0 && results[0].roomname === roomName){
          messageTimeStamp = results[0].createdAt;
          appendDiv(results, fullRefresh); 
        }
      },
      error: function (data) {
        console.error('chatterbox: Failed to send message');
      }
    })
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
      var $node = $("<div class='chatMessage'></div>").html(templateMe({
        USERNAME: aUsername,
        MESSAGE: aMessage,
        DATE: createdAt
      }, template));
      
      $("#chatbox").prepend($node);
    });
  },

  /*****************************************************************************/
  /* EVENT */
  /*****************************************************************************/
  event:function(){
    $("input[name=message]").keypress(function(event){
      if(event.keyCode === 13){
        app.setRoomName($('input[name=roomname]').val());
        userName = $('input[name=username]').val();
        send($(this).val());
        $(this).val("");
        getMessages(roomName);
        getChatRooms(refreshRoomList);
      }
    });
    $("input[name=roomname]").keypress(function(event){
      if(event.keyCode === 13){
        app.setRoomName($('input[name=roomname]').val());
        getMessages(roomName,true);
        getChatRooms(refreshRoomList);
      }
    });
  }
};

/*****************************************************************************/
/* MODEL-ACCESSORS                                                           */
/*****************************************************************************/
var refreshRoomList = function(rooms){
  $('#sidebar #roomlist').html('');

  _.each(rooms, function(room, i){
    $("#sidebar #roomlist").append($("<li class='roomName'></li>").text(room));
  });
  $("li.roomName").on('click', function(){
    app.setRoomName($(this).text());
    getMessages(roomName, true);
    $('input[name=roomname]').val(roomName);
    
  });
};
var setupSpamMacros = function(){
  $('#sidebar #roomlist').html('');

  _.each(["Dinosaur Attack"], function(item, i){
    $("#sidebarRight").append($("<li class='macro'></li>").text(item));
  });

  $("li.macro").on('click', function(){
    var text = $(this).text();
    if(text === "Dinosaur Attack"){
      console.log("DINOOOOOOO");
      for(var i = 0; i<10; i++){
        var random = Math.floor(Math.random()*40);
        var str = "Dino Attack!";
        for(var j = 0; j<random; j++){
          str += "!!!!!!!!";
        }
        send(str);
      }
    }
  });
}

var templateMe = function(object, pattern){
  _.each(object, function(value, key){
    value = escapeMe(value);
    pattern = pattern.replace(RegExp('{{'+key+'}}','g'), value);
  });
  return pattern;
};

var escapeMe = function(str) {
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
};

/*****************************************************************************/
/*****************************************************************************/
var send = app.send ; 
var getMessages = app.getMessages ; 
var getChatRooms = app.getChatRooms ; 
var roomName= app.roomName,
  userName= app.userName,
  apiUrl= app.apiUrl,
  roomTimeStamp= app.roomTimeStamp,
  messageTimeStamp= app.messageTimeStamp;
var appendDiv = app.appendDiv;

$(document).ready(function(){
  app.init();
  setupSpamMacros();
  getMessages(roomName);
  getChatRooms(refreshRoomList);
  setInterval(function(){
    getMessages(roomName);
  }, 1000);
  setInterval(function(){
    getChatRooms(refreshRoomList);
  }, 1000);
});





