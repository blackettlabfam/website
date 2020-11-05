const scriptURL =
  "https://script.google.com/macros/s/AKfycbyFub_9Ps24J11wTWTlW73ro_FaMcIVXHqcdihcXw/exec";
const form = document.forms["inductionform"];

var submissionCount = 0;
var spinner = $("#loader");

function submissionHandler() {
  var t0 = performance.now();

  fetch(scriptURL, { method: "POST", body: new FormData(form) })
    .then((response) => {
      ++submissionCount;
      // console.log('Success!' + submissionCount, response);
      var t1 = performance.now();
      if (t1 - t0 > 2000) {
        console.log(
          "Time taken" + (t1 - t0) + "ms" + "Count" + submissionCount
        );
      }
      if (submissionCount < 100) {
        submissionHandler();
      }
    })
    .catch((error) => console.error("Error!", error.message));
}

function resetWidgets() {
  spinner.hide();
  document.querySelector("#submit-form").disabled = false;
}

function redirect(form) {
  resetWidgets();

  var ukbased = form.elements.ukbased.value;
  var blackheritage = form.elements.blackheritage.value;
  var physicsqual = form.elements.physicsqual.value;

 if(ukbased === 'No' || blackheritage === 'No' || physicsqual === 'No' ) {
    window.location.href = 'redirect.html';
  } else {
    window.location.href = 'welcome.html';
  }
}

function handleError(submissionNo,error) {
  resetWidgets();
  console.error(error)

  const maxTries=3
  if(submissionNo < maxTries) {
    alert(
      "Submission failed, please try again. Tries left: " +
      (maxTries - submissionNo)+"\n\n["+error+"]"
    );
  } else {
    window.location.href = "email.html";
    throw new Error("Submission failed, exceeded 3 retries.");
  }
}

function submitSignUpForm() {
  spinner.show();
  const formData=new FormData(form);
  fetch(scriptURL, {
    method: "POST",
    cache: 'no-store',
    redirect: 'follow',
    body: formData
  })
  .then((response) => {
    return response.ok
      ? response.json()
      : Promise.reject(new Error(response.statusText+" ("+response.status+")"));
  })
  .then((respBody) => {
    if(respBody["status"]==="fail") {
      return Promise.reject(new Error(respBody["error"]));
    }
    redirect(form);
  })
  .catch((error) => {
    ++submissionCount;
    handleError(submissionCount,error);
  });
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  document.querySelector("#submit-form").disabled = true;

  if(window.location.href.slice(0,8)==="file:///") {
    submitSignUpForm();
  } else {
    grecaptcha.execute();
  }
});
