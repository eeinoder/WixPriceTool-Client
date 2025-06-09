/* main.js */

/* LOAD SCRIPTS SEQUENTIALLY */

let scripts = [
  "scripts/papaparse.min.js",
  "scripts/filehandler.js"
];

function loadScripts(scripts){
  let script = scripts.shift();
  let el = document.createElement('script');
  document.body.append(el);
  el.onload = (script) => {
    //console.log(script + ' loaded!');
      if (scripts.length) {
        loadScripts(scripts);
      }
      else {
        //console.log('run app');
      }
  };
  el.src = script;
}

loadScripts(scripts);
