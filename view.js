function redirect(form) {
  var ukbased = form.elements.ukbased.value;
  var blackheritage = form.elements.blackheritage.value;
  var physicsqual = form.elements.physicsqual.value;

 if(ukbased == 'No' || blackheritage == 'No' || physicsqual == 'No' ) {
    window.location.href = 'redirect.html';
  } else {
    window.location.href = 'welcome.html';
  }
}
