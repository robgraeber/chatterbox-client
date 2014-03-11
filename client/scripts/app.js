/*****************************************************************************/
/* GLOBAL VARIABLES                                                          */
/*****************************************************************************/
var roomName = "4chan";
var userName = 'Guest';
var apiUrl = 'https://api.parse.com/1/classes/chatterbox';
var roomTimeStamp = {}; 

/*****************************************************************************/
/* MODEL-ACCESSORS                                                           */
/*****************************************************************************/
var setRoomName = function(name){
  if(roomName !== name){
    roomName = name;
    resetChatView();
    roomTimeStamp[name] = '';
  }
};

var getChatRooms = function(aCallback){
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
};

var getMessages = function(roomName){
  var messageDate = roomTimeStamp[roomName] || "2011-03-11T09:34:08.256Z";
  $.ajax({
    url: apiUrl,
    type: 'GET',
    contentType: 'application/json',
    data: {
      order:"-createdAt",
      limit:200,
      where:JSON.stringify({"roomname":roomName, "createdAt":{"$gt":{"__type":"Date", "iso":messageDate}}})
    },
    success: function (data) { 

      var results = _.reject(data.results, function(item){
        return (new Date(item.createdAt)) > (new Date(roomTimeStamp[roomName]));
      });
      console.log(results);
      if(data.results[0] && data.results[0].createdAt){
        roomTimeStamp[roomName] = data.results[0].createdAt;
      }
      appendDiv(results);
    },
    error: function (data) {
      console.error('chatterbox: Failed to send message');
    }
  });
};

var send = function(aMessage){
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
};

var refreshRoomList = function(rooms){
  // ERASE EVERYTHING
  $('#sidebar #roomlist').html('');
  // AIM: ORDER BY LAST POST DATE
  _.each(rooms, function(room, i){
    $("#sidebar #roomlist").append($("<li class='roomName'></li>").text(room));
  });
  $("li.roomName").on('click', function(){
    setRoomName($(this).text());
    $('input[name=roomname]').val(roomName);
    getMessages(roomName);
  });
};

/*****************************************************************************/
/* VIEW                                                                      */
/*****************************************************************************/
var resetChatView = function(){
  $("#chatbox").html("");
};

var appendDiv = function(messages){
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
};

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
/* INITIALIZATION / RUNTIME                                                  */
/*****************************************************************************/
$(document).ready(function(){
  $("input[name=message]").keypress(function(event){
    if(event.keyCode === 13){
      setRoomName($('input[name=roomname]').val());
      userName = $('input[name=username]').val();
      send($(this).val());
      $(this).val("");
      getMessages(roomName);
      getChatRooms(refreshRoomList);
    }
  });
  $("input[name=roomname]").keypress(function(event){
    if(event.keyCode === 13){
      setRoomName($('input[name=roomname]').val());
      getMessages(roomName);
      getChatRooms(refreshRoomList);
    }
  });
  setInterval(function(){
    getMessages(roomName);
  }, 1000);
  setInterval(function(){
    getChatRooms(refreshRoomList);
  }, 1000);
});





