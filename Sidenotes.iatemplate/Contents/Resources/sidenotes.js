(function () {
  var DEBUG = false; // set to true to re-enable on-page debugging

  function setDebug(message) {
    if (!DEBUG || !document || !document.body) {
      return;
    }

    var note = document.getElementById("ia-sidenote-debug");
    if (!note) {
      note = document.createElement("div");
      note.id = "ia-sidenote-debug";
      note.className = "ia-sidenote-debug";
      document.body.appendChild(note);
    }

    note.textContent = "Sidenotes debug: " + message;
  }

  function hasClass(element, className) {
    if (!element) {
      return false;
    }
    if (element.classList) {
      return element.classList.contains(className);
    }
    return (" " + element.className + " ").indexOf(" " + className + " ") !== -1;
  }

  function addClass(element, className) {
    if (!element) {
      return;
    }
    if (element.classList) {
      element.classList.add(className);
      return;
    }
    if (!hasClass(element, className)) {
      element.className += (element.className ? " " : "") + className;
    }
  }

  function removeClass(element, className) {
    if (!element) {
      return;
    }
    if (element.classList) {
      element.classList.remove(className);
      return;
    }
    element.className = (" " + element.className + " ").replace(" " + className + " ", " ").replace(/^\s+|\s+$/g, "");
  }

  function closestSup(node) {
    var current = node;
    while (current && current !== document) {
      if (current.nodeType === 1 && current.tagName.toLowerCase() === "sup") {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  function insertAfter(referenceNode, newNode) {
    if (!referenceNode || !referenceNode.parentNode) {
      return;
    }
    if (referenceNode.nextSibling) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    } else {
      referenceNode.parentNode.appendChild(newNode);
    }
  }

  function clearGenerated(root) {
    var generated = root.querySelectorAll(".sidenote-toggle, .sidenote-number, .sidenote");
    var i;
    for (i = 0; i < generated.length; i += 1) {
      if (generated[i].parentNode) {
        generated[i].parentNode.removeChild(generated[i]);
      }
    }

    var attached = root.querySelectorAll("[data-sidenote-attached='true']");
    for (i = 0; i < attached.length; i += 1) {
      attached[i].removeAttribute("data-sidenote-attached");
      removeClass(attached[i], "sidenote-ref");
    }

    var sourceLists = root.querySelectorAll(".ia-footnote-source-list");
    for (i = 0; i < sourceLists.length; i += 1) {
      removeClass(sourceLists[i], "ia-footnote-source-list");
    }

    var sourceItems = root.querySelectorAll(".ia-footnote-source-item");
    for (i = 0; i < sourceItems.length; i += 1) {
      removeClass(sourceItems[i], "ia-footnote-source-item");
    }

    removeClass(root, "ia-js-sidenotes");
  }

  function isFootnoteId(id) {
    if (!id) {
      return false;
    }
    if (id.indexOf("fnr") === 0) {
      return false;
    }
    return id.indexOf("fn") === 0;
  }

  function collectNoteItems(root) {
    var items = [];
    var seen = {};
    var i;
    var primary = root.querySelectorAll(".footnotes ol > li[id], .footnotes li[id]");

    function addUnique(el) {
      if (!el || !el.id || !isFootnoteId(el.id)) {
        return;
      }
      if (seen[el.id]) {
        return;
      }
      seen[el.id] = true;
      items.push(el);
    }

    for (i = 0; i < primary.length; i += 1) {
      addUnique(primary[i]);
    }

    if (items.length === 0) {
      var fallback = root.querySelectorAll("li[id], div[id], section[id], aside[id]");
      for (i = 0; i < fallback.length; i += 1) {
        addUnique(fallback[i]);
      }
    }

    return items;
  }

  function buildSidenotes(root) {
    if (!root) {
      setDebug("build aborted: no root");
      return;
    }

    clearGenerated(root);

    var notesById = {};
    var noteNumberById = {};
    var noteItems = collectNoteItems(root);
    var hasFootnotesClass = !!root.querySelector(".footnotes");
    if (noteItems.length === 0) {
      setDebug("no note items found; refs scan will continue");
    }

    var i;
    for (i = 0; i < noteItems.length; i += 1) {
      var item = noteItems[i];
      var clone = item.cloneNode(true);
      var backLinks = clone.querySelectorAll(".reversefootnote");
      var j;
      for (j = 0; j < backLinks.length; j += 1) {
        backLinks[j].parentNode.removeChild(backLinks[j]);
      }

      var html = clone.innerHTML.replace(/^\s+|\s+$/g, "");
      if (html) {
        notesById[item.id] = html;
      }
      noteNumberById[item.id] = String(i + 1);

      addClass(item, "ia-footnote-source-item");
      if (item.parentNode && item.parentNode.nodeType === 1) {
        addClass(item.parentNode, "ia-footnote-source-list");
      }
    }

    var counter = 0;
    var references = root.querySelectorAll("a.footnote, a[href*='#fn']");
    var totalReferences = 0;
    for (i = 0; i < references.length; i += 1) {
      var reference = references[i];
      if (hasClass(reference, "reversefootnote")) {
        continue;
      }

      totalReferences += 1;

      var href = reference.getAttribute("href");
      if (!href) {
        continue;
      }

      var hashIndex = href.lastIndexOf("#");
      var noteId = hashIndex >= 0 ? href.slice(hashIndex + 1) : href;
      var noteHtml = notesById[noteId];
      if (!noteHtml) {
        continue;
      }

      var host = closestSup(reference) || reference;
      if (host.getAttribute("data-sidenote-attached") === "true") {
        continue;
      }

      counter += 1;
      var toggleId = "sn-" + counter + "-" + noteId;
      var markerText = String(counter);

      var toggle = document.createElement("input");
      toggle.type = "checkbox";
      toggle.id = toggleId;
      toggle.className = "sidenote-toggle";

      var label = document.createElement("label");
      label.className = "sidenote-number";
      label.setAttribute("for", toggleId);
      label.textContent = markerText;

      var note = document.createElement("aside");
      note.className = "sidenote";
      note.id = noteId + "-sidenote";

      var noteContent = document.createElement("div");
      noteContent.className = "sidenote-content";
      noteContent.innerHTML = noteHtml;

      var marker = document.createElement("span");
      marker.className = "sidenote-marker";
      marker.textContent = markerText;

      var firstContentChild = noteContent.firstElementChild;
      if (firstContentChild && firstContentChild.tagName && firstContentChild.tagName.toLowerCase() === "p") {
        firstContentChild.insertBefore(marker, firstContentChild.firstChild);
        firstContentChild.insertBefore(document.createTextNode(" "), marker.nextSibling);
      } else {
        noteContent.insertBefore(marker, noteContent.firstChild);
        noteContent.insertBefore(document.createTextNode(" "), marker.nextSibling);
      }

      note.appendChild(noteContent);

      addClass(host, "sidenote-ref");
      host.setAttribute("data-sidenote-attached", "true");
      reference.setAttribute("aria-describedby", note.id);

      insertAfter(host, toggle);
      insertAfter(toggle, label);
      insertAfter(label, note);
    }

    if (counter > 0) {
      addClass(root, "ia-js-sidenotes");
    }

    setDebug(
      "items=" + noteItems.length +
      ", hasFootnotesClass=" + (hasFootnotesClass ? "yes" : "no") +
      ", refs=" + totalReferences +
      ", attached=" + counter
    );
  }

  function init() {
    var root = document.body;
    if (!root) {
      return;
    }

    setDebug("script initialized");

    function rerender() {
      setDebug("rendering...");
      buildSidenotes(root);
    }

    rerender();
    window.setTimeout(rerender, 50);
    window.setTimeout(rerender, 250);
    window.setTimeout(rerender, 800);

    var ticks = 0;
    var keepAlive = window.setInterval(function () {
      rerender();
      ticks += 1;
      if (ticks > 20) {
        window.clearInterval(keepAlive);
      }
    }, 250);

    root.addEventListener("ia-writer-change", function () {
      rerender();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
