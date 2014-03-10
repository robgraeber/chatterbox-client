// YOUR CODE HERE:
$.ajax({
  // always use this url
  url: 'https://api.parse.com/1/classes/chatterbox',
  type: 'GET',
  contentType: 'application/json',
  data: {
    order:"-createdAt",
    where:{"roomname":"4chan"}
  },
  success: function (data) {
    appendDiv(data.results);
  },
  error: function (data) {
    // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
    console.error('chatterbox: Failed to send message');
  }
});

var appendDiv = function(messages){
  _.each(messages, function(item, i){
    var $node = $("<div class='chatMessage'></div>").text(item.username.substring(0, 25) +": "+item.text.substring(0,140));
    $("#chatbox").append($node);
    console.log("message", item);
  });
};