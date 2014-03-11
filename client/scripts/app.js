var roomName = "4chan";
var userName = 'Guest';
var apiUrl = 'https://api.parse.com/1/classes/chatterbox';
var lastTimestamp = {};

var appendDiv = function(messages){
  $('#chatbox').html('');

  _.each(messages, function(item, i){
    // CHECK FOR PRESENCE IN MESSAGE
    // IF is in Cache THEN 

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

    // STORE IN CACHE
    
    $("#chatbox").append($node);
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
}
var getRoomList = function(aCallback){
  aCallback = aCallback || function(item){console.log(item)}; 
  $.ajax({
    // always use this url
    url: apiUrl,
    type: 'GET',
    contentType: 'application/json',
    data: {order:"-createdAt",limit:200},
    success: function (data) {
      aCallback(_.filter(_.uniq(_.pluck(data.results, 'roomname')), function(item){
        return !!item;
      }));
    },
    error: function (data) {
      // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send message');
    }
  })
};

var getMessages = function(roomName){
//, "createdAt":{"$gt":{"__type":"Date", "iso":"2012-04-30T09:34:08.256Z"}}
  $.ajax({
    // always use this url
    url: apiUrl,
    type: 'GET',
    contentType: 'application/json',
    data: {
      order:"-createdAt",
      limit:10,
      where:{"roomname":roomName}// order:{"-createdAt":{"$gte":timestamp}},
    },
    success: function (data) { 
      console.log(data);
      appendDiv(data.results);
      // lastTimestamp[roomName] = data.results[0].createdAt;
    },
    error: function (data) {
      // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send message');
    }
  });
}

var sendMessage = function(aMessage){
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

    roomName = $(this).text();
    $('input[name=roomname]').val(roomName);
    getMessages(roomName);
  });
}
// INIT
getMessages(roomName);
getRoomList(refreshRoomList);
// REFRESH

$(document).ready(function(){
  
  // INPUT MESSAGE
  $("input[name=message]").keypress(function(event){
    if(event.keyCode === 13){
      roomName = $('input[name=roomname]').val();
      userName = $('input[name=username]').val();
      sendMessage($(this).val());
      $(this).val("");
      getMessages(roomName);
      getRoomList(refreshRoomList);
    }
  });
  $("input[name=roomname]").keypress(function(event){
    if(event.keyCode === 13){
      roomName = $('input[name=roomname]').val();
      getMessages(roomName);
      getRoomList(refreshRoomList);
    }
  });
  setInterval(function(){
    getMessages(roomName);
  }, 1000);
  setInterval(function(){
    getRoomList(refreshRoomList);
  }, 1000);
});





