const form = document.forms["inductionform"];

// Apps Script sometimes takes ages to process request, so we need a timeout.
const appsScriptTimeoutMs=15000;

// The first time the user loses their network signal during
// grecaptcha.execute(), reCAPTCHA calls the error handler. If they press submit
// again, before the signal comes back, and the signal comes back before
// reCAPTCHA reports an error, grecaptcha.execute() may block indefinitely. The
// only reliable way to prevent this, without sacrificing usability, seems to be
// to unconditionally reset reCAPTCHA after a long timeout.
const recaptchaTimeoutMs=60000;

const maxNoErrors=3;

function fetchWithTimeout(timeLimitMs, resource, init) {
  return new Promise((resolve,reject) => {
    var controller = new AbortController();
    init["signal"]=controller.signal;

    const timeout=setTimeout(() => {
      controller.abort();
      console.log("Aborted fetch");
      reject(new Error("Server took too long to respond"));
    }, timeLimitMs);
    console.log("Launched fetch timeout");

    fetch(resource,init).then(resolve,reject).finally(
      ()=>{clearTimeout(timeout); console.log("Cleared fetch timeout");}
    );
  });
}

const loadedLocally=window.location.href.slice(0,8)==="file:///";

// This is based on https://stackoverflow.com/a/31374433/1292784 and
// http://www.jspatterns.com/the-ridiculous-case-of-adding-a-script-element/
function callWithAppsScriptURL(func,errorHandler) {
  const appsScriptURL="https://script.google.com/macros/s/AKfycbyFub_9Ps24J11wTWTlW73ro_FaMcIVXHqcdihcXw/exec";
  if(loadedLocally) {
    const jsPath="js/.DO_NOT_COMMIT_recaptchaBypassCode.js";
    console.log("Loading "+jsPath);
    var script=document.createElement("script");
    script.src=jsPath;
    script.onload=() => {func(appsScriptURL+"?"+recaptchaBypassCode());};
    script.onerror=() => {alert("File not found: "+jsPath); errorHandler();};

    var first=document.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(script,first);
  } else {
    func(appsScriptURL);
  }
}

var spinner = $("#loader");
var attemptingSubmission=false;

function preSubmitHandler() {
  spinner.show();
  document.querySelector("#submit-form").disabled = true;
  attemptingSubmission=true;
}

function postSubmitHandler() {
  spinner.hide();
  document.querySelector("#submit-form").disabled = false;
  attemptingSubmission=false;
}

function redirect(form) {
  postSubmitHandler();

  var ukbased = form.elements.ukbased.value;
  var blackheritage = form.elements.blackheritage.value;
  var physicsqual = form.elements.physicsqual.value;

 if(ukbased === 'No' || blackheritage === 'No' || physicsqual === 'No' ) {
    window.location.href = 'redirect.html';
  } else {
    window.location.href = 'welcome.html';
  }
}

var errorCount = 0;

function handleError(error) {
  console.error(error);

  ++errorCount;
  const canRetry=errorCount < maxNoErrors;

  if(canRetry && attemptingSubmission) {
    alert(
      "Submission failed, please try again. Tries left: " +
      (maxNoErrors - errorCount)+"\n\n["+error+"]"
    );
  }

  postSubmitHandler();

  if(!canRetry) {
    const formData=new FormData(form);
    var data="";
    formData.forEach((value,key) => {
      if(key!=="g-recaptcha-response") {data+=key+": "+value+"\n";}
    });
    window.location.href = "email.html?data="+encodeURIComponent(data);
  }
}

function handleRecaptchaError() {
  if(!loadedLocally) {
    handleError(new Error("Cannot connect to reCAPTCHA server"));
  }
}

var recaptchaTimeout=null;

function submitSignUpForm() {
  if(recaptchaTimeout!==null) {
    clearTimeout(recaptchaTimeout);
    recaptchaTimeout=null;
    console.log("Cleared reCAPTCHA timeout");
  }

  const formData=new FormData(form);
  callWithAppsScriptURL(scriptURL => {
    fetchWithTimeout(appsScriptTimeoutMs, scriptURL, {
      method: "POST",
      cache: 'no-store',
      redirect: 'follow',
      body: formData
    })
    .then(response => {
      return response.ok
        ? response.json()
        : Promise.reject(
            new Error(response.statusText+" ("+response.status+")"));
    })
    .then(respBody => {
      if(respBody["status"]==="failed") {
        return Promise.reject(new Error(respBody["error"]));
      }
      redirect(form);
    })
    .catch(handleError);
  }, postSubmitHandler);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  preSubmitHandler();

  if(loadedLocally) {
    submitSignUpForm();
  } else {
    recaptchaTimeout=setTimeout(() => {
      if(recaptchaTimeout!==null) {
        grecaptcha.reset();
        handleRecaptchaError();
        recaptchaTimeout=null;
        console.log("Reset reCAPTCHA");
      }
    }, recaptchaTimeoutMs);
    console.log("Launched reCAPTCHA timeout");

    grecaptcha.execute();
  }
});
