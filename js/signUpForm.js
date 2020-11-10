// Apps Script sometimes takes ages to process request, so we need a timeout.
const appsScriptTimeLimitMs=15000;

// The first time the user loses their network signal during
// grecaptcha.execute(), reCAPTCHA calls the error handler. If they press submit
// again, before the signal comes back, and the signal comes back before
// reCAPTCHA reports an error, grecaptcha.execute() may block indefinitely. The
// only reliable way to prevent this, without sacrificing usability, seems to be
// to unconditionally reset reCAPTCHA after a long timeout.
const recaptchaTimeLimitMs=60000;

const maxNoErrors=3;

const form = document.forms["inductionform"];
var cookiesCheckbox=document.querySelector("#recaptchaCookies");


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

function prependScriptNode(url,onLoad,onError) {
  console.log("Loading "+url);
  var script=document.createElement("script");
  script.src=url;
  script.onload=onLoad;
  script.onerror=onError;

  var first=document.getElementsByTagName("script")[0];
  first.parentNode.insertBefore(script,first);
}

// This is based on https://stackoverflow.com/a/31374433/1292784 and
// http://www.jspatterns.com/the-ridiculous-case-of-adding-a-script-element/
function callWithAppsScriptURL(func,errorHandler) {
  const appsScriptURL="https://script.google.com/macros/s/AKfycbyFub_9Ps24J11wTWTlW73ro_FaMcIVXHqcdihcXw/exec";
  if(loadedLocally) {
    if(typeof recaptchaBypassCode !== "function") {
      const jsPath="js/.DO_NOT_COMMIT_recaptchaBypassCode.js";
      prependScriptNode(
        jsPath,
        () => {func(appsScriptURL+"?"+recaptchaBypassCode());},
        () => {alert("File not found: "+jsPath); errorHandler();}
      );
      return;
    } else {
      func(appsScriptURL+"?"+recaptchaBypassCode());
    }
  } else {
    func(appsScriptURL);
  }
}

function showHavingTrouble() {
  var havingTrouble=document.querySelector("#havingTrouble");
  havingTrouble.style.display="inherit";
  havingTrouble.scrollIntoView(true);
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

function formToKeyValuePairs() {
  const formData=new FormData(form);
  var data="";
  var isFirst=true;
  formData.forEach((value,key) => {
    if(key!=="g-recaptcha-response") {
      if(!isFirst) {data+=',\n';}
      data+='"'+key+'": '+JSON.stringify(value);
      isFirst=false;
    }
  });
  return data;
}

function updateFormCode() {
  const body=
    "===== Please do not modify the data below this line =====\n\n"+
    formToKeyValuePairs();

  var link=document.querySelector("#emailData");
  link.setAttribute(
    "href",
    "mailto:community@theblackettlabfamily.com?subject=Join%20Request&body="+
    encodeURIComponent("\n\n"+body)
  );

  var box=document.querySelector("#dataBox");
  box.textContent=body;
}

function handleError(error) {
  console.error(error);

  ++errorCount;
  const canRetry=errorCount < maxNoErrors;

  if(canRetry && attemptingSubmission) {
    alert("Submission failed, please try again.\n\n["+error+"]");
  }

  postSubmitHandler();

  if(!canRetry) {showHavingTrouble();}
}

function handleRecaptchaError() {
  if(!loadedLocally) {
    handleError(new Error("Cannot connect to reCAPTCHA server"));
  }
}

function ensureRecaptchaIsLoaded(onLoad) {
  if(typeof grecaptcha === "object") {
    onLoad();
  } else {
    const errMsg=
      "Can't load reCAPTCHA. Try refreshing the page when you're back online.";
    prependScriptNode(
      "https://www.google.com/recaptcha/api.js",onLoad,
      ()=>{alert(errMsg);}
    );
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
    fetchWithTimeout(appsScriptTimeLimitMs, scriptURL, {
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
    setTimeout(showHavingTrouble, recaptchaTimeLimitMs);

    recaptchaTimeout=setTimeout(() => {
      if(recaptchaTimeout!==null) {
        grecaptcha.reset();
        handleRecaptchaError();
        recaptchaTimeout=null;
        console.log("Reset reCAPTCHA");
      }
    }, recaptchaTimeLimitMs);
    console.log("Launched reCAPTCHA timeout");

    grecaptcha.execute();
  }
});

cookiesCheckbox.addEventListener("change",(e) => {
  var optOut=document.querySelector("#cookiesOptOut");
  var filter;
  var disableForm;

  if(cookiesCheckbox.checked) {
    optOut.style.display="none";
    disableForm=false;
    filter="none";
  } else {
    optOut.style.display="inherit";
    disableForm=true;
    filter="opacity(35%)";
  }

  var submitButton=document.querySelector("#submit-form");
  for(var i=0; i<form.elements.length; ++i) {
    if(disableForm || form.elements[i]!==submitButton) {
      form.elements[i].disabled=disableForm;
    }
  }
  form.style.filter=filter;

  if(!disableForm) {
    ensureRecaptchaIsLoaded(()=>{submitButton.disabled=false;});
  }
});

form.addEventListener("change",(e) => updateFormCode());

document.querySelector("#copyData").addEventListener("click",(e) => {
  var dataBox=document.querySelector("#dataBox");
  dataBox.select();
  dataBox.setSelectionRange(0, 2000);
  document.execCommand("copy");
});

updateFormCode();
