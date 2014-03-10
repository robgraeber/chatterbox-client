
var roomName = "4chan";

var appendDiv = function(messages){
  $('#chatbox').html('');
  _.each(messages, function(item, i){
    var aUsername = item.username || 'guest' ;
    var aMessage = item.text || 'default text' ;
    var $node = $("<div class='chatMessage'></div>").text(aUsername.substring(0, 25) +": "+aMessage.substring(0,140));
    $("#chatbox").append($node);
  });
};

var refreshChat = function(roomName){
  $.ajax({
    // always use this url
    url: 'https://api.parse.com/1/classes/chatterbox',
    type: 'GET',
    contentType: 'application/json',
    data: {
      order:"-createdAt",
      where:{"roomname":roomName}
    },
    success: function (data) { appendDiv(data.results);},
    error: function (data) {
      // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
      console.error('chatterbox: Failed to send message');
    }
  });
}
 
// INIT
refreshChat(roomName);
// REFRESH
 setInterval(function(){
  refreshChat(roomName);
 }, 1000);
