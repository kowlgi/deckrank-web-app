var minusHandler =  function() {
    var row_index = this.parentNode.parentNode.rowIndex;

   // Add glyph-plus to prev 'add_another' element if 'this' is the last row
   if (row_index + 1 ==   $('#extra_options').find('input').length) {
       var prev = document.getElementsByClassName("trhideclass")[row_index - 1];
       $(prev).children('.glyph_parent').children(".add_another").children('.glyphicon-plus').removeClass('hidden');
    }

    // Remove current class
    var element = document.getElementsByClassName("trhideclass")[row_index];
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
        <tr class="trhideclass"> \
          <td> \
            <input type="text" id="opt' + i + '" name="option'+ i +'" placeholder="" class="form-control"> \
          </td> \
          <td class="glyph_parent"> \
            <a href="#" id="add_another' + i  + '" class="add_another" ><span class="glyphicon glyphicon-plus"></span></a> \
            <a href="#" id="remove' + i  + '"><span class="glyphicon glyphicon-minus"></span></a> \
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
