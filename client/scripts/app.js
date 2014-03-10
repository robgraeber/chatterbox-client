var roomName = "4chan";
var userName = 'Rob';

var appendDiv = function(messages){
  $('#chatbox').html('');
  _.each(messages, function(item, i){
    var aUsername = item.username || 'guest' ;
    var aMessage = item.text || 'default text' ;
    var createdAt = item.createdAt || '?';
    var $node = $("<div class='chatMessage'></div>").text(createdAt +' '+ aUsername.substring(0, 25) +": "+aMessage.substring(0,140));
    $("#chatbox").append($node);
  });
};

var refreshRoomList = function(aCallback){
  aCallback = aCallback || function(item){console.log(item)}; 
  $.ajax({
    // always use this url
    url: 'https://api.parse.com/1/classes/chatterbox',
    type: 'GET',
    contentType: 'application/json',
    data: {limit:200},
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

var refreshChat = function(roomName){
  $.ajax({
    // always use this url
    url: 'https://api.parse.com/1/classes/chatterbox',
    type: 'GET',
    contentType: 'application/json',
    data: {
      order:"-createdAt",
      limit:10,
      where:{"roomname":roomName}
    },
    success: function (data) { appendDiv(data.results);},
    error: function (data) {
      // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send message');
    }
  });
}

var sendMessage = function(aMessage){
  $.ajax({
    url: 'https://api.parse.com/1/classes/chatterbox',
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
 
// INIT
refreshChat(roomName);

refreshRoomList(function(rooms){
  $('#sidebar').html('');
  _.each(rooms, function(room, i){
    $("#sidebar").append($("<li class='roomName'></li>").text(room));
  });
})
// REFRESH

setInterval(function(){
  refreshChat(roomName);
}, 1000);
setInterval(function(){
  refreshChat(roomName);
 }, 1000);

$(document).ready(function(){
  $("input[name=message]").keypress(function(event){
    if(event.keyCode === 13){
      sendMessage($(this).val());
      $(this).val("");
    }
  })
});





