function createStackrank(what) {
    httpRequest.open('GET', 'http://localhost:3000/create', true);
    httpRequest.send(null);
}

var minusHandler =  function() {
    var index = this.id.match(/\d+/)[0];
    var prev_index = index - 1;

   // Add glyph-plus to prev 'add_another' element: BELOW LOGIC IS INCORRECT, need to fix it
   // by counting number of 'add_anotherX' nodes, checking if this is the last one and if so,
  // removing the 'hidden' class from the previous 'add_another' node.
   if (index ==   $('#extra_options').find('input').length) {
       var prev = document.getElementById("add_another" + prev_index);
       $(prev).children('.glyphicon-plus').removeClass('hidden');
    }

    // Remove current class
    var element = document.getElementsByClassName("trhideclass" + index)[0];
    var parent = element.parentNode;
    parent.removeChild(element);
};

var plusHandler = function() {
    var glyph = $(this).children('.glyphicon-plus').addClass('hidden');
    var extraOptionsDiv = $('#extra_options');
    // count the number of input fields prefixed with a new paragraph inside tag 'extra_options'
    var i = ++COUNT;
    function returnOption(i) {
      return '\
        <tr class="trhideclass' + i + '"> \
          <td> \
            <input type="text" id="opt' + i + '" name="option'+ i +'" placeholder="Option ' + i
            + ' ..." class="form-control"> \
          </td> \
          <td class="glyph_parent"> \
            <a href="#" id="add_another' + i  + '" ><span class="glyphicon glyphicon-plus"></span></a> \
            <a href="#" id="remove' + i  + '" ><span class="glyphicon glyphicon-minus"></span></a> \
          </td> \
        </tr>';
    };

    $(returnOption(i)).appendTo(extraOptionsDiv);
    $("#add_another"+ i ).click(plusHandler);
    $("#remove" + i  ).click(minusHandler);
}

$("#add_another2").click(plusHandler);
var COUNT = 2;

// set sortable elements in rank/:id to default state
$( "#sortable" ).sortable();
$( "#sortable" ).disableSelection();
