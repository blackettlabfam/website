// Get query parameter
// Source: https://css-tricks.com/snippets/javascript/get-url-variables/
function getQueryParameter(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == variable) {
        return pair[1];
      }
    }
    return (false);
  }

  function redirect() {

  // Capture the `ukbased` query parameter from the URL.
  var ukbased = getQueryParameter('ukbased')
  var blackheritage = getQueryParameter('blackheritage')
  var physicsqual = getQueryParameter('physicsquals')


  if(ukbased == 'No' || blackheritage == 'No' || physicsqual == 'No' ) {
    window.location.href = 'redirect.html';

  } else {
    window.location.href = 'welcome.html';

  }


  }
