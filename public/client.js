$(document).ready(function () {
  
  /* Global io */
  let socket = io();

  console.log('user ' + socket.request.user.name + ' connected');

  socket.on('user count', function (data) {
    console.log(data);
  });

  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();

    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
});
