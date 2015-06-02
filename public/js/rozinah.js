/*!
 * rozinah.js
 *
 * Copyright 2015–2015, Sunil Kowlgi, Hareesh Nagarajan
 */
var minusHandler =  function() {
    var row_index = this.parentNode.parentNode.rowIndex;
    var num_rows = $('#extra_options').find('input').length;

   // Add glyph-plus to prev 'add_another' element if 'this' is the last row
   if (row_index + 1 == num_rows) {
       var prev = document.getElementsByClassName("trhideclass")[row_index - 1];
       var elem = $(prev).children('.glyph_parent').children(".add_another")
       elem.children('.glyphicon-plus').removeClass('invisible');
       elem.removeClass('disableClick');
    }

    // Remove current class
    var element = document.getElementsByClassName("trhideclass")[row_index];
    var parent = element.parentNode;
    parent.removeChild(element);

    // Make sure the plus glyph is visible for the last row (we might have
    // made it invisible it in the minusHandler() because of the
    // LIMIT TO 10 rule. )
    var last = document.getElementsByClassName("trhideclass")[num_rows - 2];
    var elem = $(last).children('.glyph_parent').children(".add_another");
    elem.children('.glyphicon-plus').removeClass('invisible');
    elem.removeClass('disableClick');
};

var plusHandler = function() {
    $(this).children('.glyphicon-plus').addClass('invisible');
    $(this).addClass('disableClick');

    var extraOptionsDiv = $('#extra_options');

    // count the number of input fields prefixed with a new paragraph inside
    // tag 'extra_options'
    var i = ++COUNT;

    // LIMIT TO 10 rule: Impose a limit of 10 on the number of options as a
    // poll will get out of hand beyond that.
    var hide_plus =
        extraOptionsDiv.find('input').length == 9 ? true : false;

    function returnOption(i) {
      return '\
        <tr class="trhideclass"> \
          <td> \
            <input type="text" id="opt' + i + '" name="option'+ i +'" placeholder="" class="form-control" maxlength="100"> \
          </td> \
          <td class="glyph_parent"> \
            <a href="#" id="add_another' + i  + '" class="add_another" ><span class="glyphicon glyphicon-plus"></span></a> \
            <a href="#" id="remove' + i  + '"><span class="glyphicon glyphicon-minus"></span></a> \
          </td> \
        </tr>';
    };

    $(returnOption(i)).appendTo(extraOptionsDiv);

    var elem = $("#add_another"+ i );
    if(hide_plus) {
        elem.children('.glyphicon-plus').addClass('invisible');
        elem.addClass('disableClick');
    }
    elem.click(plusHandler);
    $("#remove" + i  ).click(minusHandler);
}

$("#add_another2").click(plusHandler);
var COUNT = 2;

// to highlight menu item you've clicked on the navigation bar
$('.nav li').click(function(){
    $('.nav li').removeClass('active');
    $(this).addClass('active');
});

<!-- Webshims polyfill -->
jQuery.webshims.polyfill('forms');

// set sortable elements in r/:id to default state
$( "#sortable" ).sortable();
$( "#sortable" ).disableSelection();
