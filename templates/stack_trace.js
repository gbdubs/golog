{{define "stack_trace_js"}}
/* stack_trace.js */

const idStackTraceWrapper = "stack-trace";

const classEntry = "entry";
const classStackTrace = "stack-trace";
const classStackTraceLine = "stack-trace-line";
const classCodeFile = "code-file";
const classCodeFileLine = "code-file-line";
const classHoveredStackTraceLine = "hovered-stack-trace-line";
const classHoveredCodeLine = "hovered-code-file-line";
const classHighlightedCodeLine = "highlighted-code-file-line";
const classHidden = "hidden";
const classBreakpointArgName = "breakpoint-arg-name";
const classHoveredArgName = "hovered-breakpoint-arg-name"

const attributeDataStackTraceId = "data-stack-trace-id";
const attributeDataCodeFilePath = "data-code-file-path";
const attributeDataLineStr = "data-line-str";

class StackTrace {
  constructor(element) {
    this.element = element;
  }
  getId() {
    return this.element.getAttribute(attributeDataStackTraceId);
  }
  init() {
    this.simplifyLines();
    this.setUpCodeFileLinks();
    this.setUpVariableNames();
  }
  simplifyLines() {
    const lines = this.element.getElementsByClassName(classStackTraceLine);
    let lastLineStr = undefined;
    let times = 0;
    const toRemove = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.getAttribute(attributeDataLineStr)) {
        line.setAttribute(attributeDataLineStr, line.innerText)
      }
      let lineStr = line.getAttribute(attributeDataLineStr);
      if (this.containsUnhelpfulFile(lineStr)) {
        toRemove.push(line)
        continue;
      }
      if (lineStr.indexOf("go/src/") > 0) {
        lineStr = lineStr.substring(lineStr.indexOf("go/src/") + 7);
      }
      if (lineStr === lastLineStr) {
        times++;
        toRemove.push(line)
        continue;
      }
      if (times > 0) {
        let timesLine = "(" + (times+1) +" times)";
        timesLine = " ".repeat(lastLineStr.length - timesLine.length) + timesLine;
        toRemove.pop(); // Cancels the deletion of the last line
        lines[i-1].innerText = timesLine;
        times = 0;
      }
      line.innerText = this.getMinimalContext(lastLineStr, lineStr);
      lastLineStr = lineStr;
    }
    toRemove.forEach(tr => tr.remove());
  }
  containsUnhelpfulFile(s) {
    return s.indexOf("github.com/gbdubs/golog/entry.go") >= 0 ||  
      s.indexOf("github.com/gbdubs/golog/golog.go") >= 0 ||  
      s.indexOf("github.com/gbdubs/golog/stack_trace.go") >= 0 ||  
      s.indexOf("runtime/debug/stack.go") >= 0;
  }
  getMinimalContext(a, b) {
    if (a == undefined) {
      return b;
    }
    const aSplits = a.split("/");
    const bSplits = b.split("/");
    let numSpacesToPrefixBy = 0;
    let result = "";
    for (let i = 0; i < bSplits.length; i++) {
      if (i >= aSplits.length || aSplits[i] !== bSplits[i] || result.length > 0) {
        result = result + "/" + bSplits[i];
      } else { 
        numSpacesToPrefixBy += aSplits[i].length + 1;
      }
    }
    return " ".repeat(numSpacesToPrefixBy - 1) + result;
  }
  setUpCodeFileLinks() {
    const filePathToRelevantLines = {};
    const lines = this.element.getElementsByClassName(classStackTraceLine);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStrSplits = line.getAttribute(attributeDataLineStr).split(":");
      const filePath = lineStrSplits[0];
      const lineNumber = parseInt(lineStrSplits[1]);
      if (!filePathToRelevantLines[filePath]) {
        filePathToRelevantLines[filePath] = [];
      }
      if (!filePathToRelevantLines[filePath].includes(lineNumber)) {
        filePathToRelevantLines[filePath].push(lineNumber);
      }
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStrSplits = line.getAttribute(attributeDataLineStr).split(":");
      const filePath = lineStrSplits[0];
      const lineNumber = parseInt(lineStrSplits[1]);
      line.onclick = () => {
        STACK_TRACE_PAGE.showCodeFile(filePath, filePathToRelevantLines[filePath]);
      };
      line.onmouseover = () => {
        line.classList.add(classHoveredStackTraceLine);
        STACK_TRACE_PAGE.hoverCodeFile(filePath, lineNumber);
      }
      line.onmouseout = () => {
        line.classList.remove(classHoveredStackTraceLine);
        STACK_TRACE_PAGE.hoverCodeFile(filePath, -1);
      }
    }
  }
  setUpVariableNames() {
    const argElements = this.element.getElementsByClassName(classBreakpointArgName);
    if (argElements.length === 0) {
      return
    }
    const lines = this.element.getElementsByClassName(classStackTraceLine);
    const lineStrSplits = lines[lines.length - 1].getAttribute(attributeDataLineStr).split(":");
    const filePath = lineStrSplits[0];
    const lineNumber = parseInt(lineStrSplits[1]);
    const lineOfCode = STACK_TRACE_PAGE.codeFiles[filePath].lines[lineNumber].innerText.trim();
    const argNames = /BreakPoint\((.*)\)/.exec(lineOfCode)[1].split(",");
    for (let i = 0; i < argNames.length; i++) {
      const argElement = argElements[i];
      argElement.onclick = () => {
        STACK_TRACE_PAGE.showCodeFile(filePath, [lineNumber]);
      };
      argElement.onmouseover = () => {
        argElement.classList.add(classHoveredArgName);
        STACK_TRACE_PAGE.hoverCodeFile(filePath, lineNumber);
      }
      argElement.onmouseout = () => {
        argElement.classList.remove(classHoveredArgName);
        STACK_TRACE_PAGE.hoverCodeFile(filePath, -1);
      }
      // The First Arg Name will correspond to the logged message.
      if (i != 0) {
        argElement.innerText = argNames[i].trim();
      }
    }
  }
  hide() {
    this.element.classList.add(classHidden);
  }
  show() {
    this.element.classList.remove(classHidden);
  }
}

class CodeFile {
  constructor (element) {
    this.element = element;
    this.isShown = false;
    this.lines = [];
    this.currentHighlights = [];
    this.currentHover = -1;
  }
  init() {
    const lineElements = this.element.getElementsByClassName(classCodeFileLine);
    // Lines start numbered from one, so to allow line numbering to align (PUN) with the lines 
    // field, we push an empty object into the 0th index.
    this.lines.push([]);
    for (let i = 0; i < lineElements.length; i++) {
      this.lines.push(lineElements[i]);
    }
  }
  highlightLines(lineNumbers) {
    for (let i = 0; i < this.currentHighlights.length; i++) {
      this.lines[this.currentHighlights[i]].classList.remove(classHighlightedCodeLine);
    }
    for (let i = 0; i < lineNumbers.length; i++) {
      this.lines[lineNumbers[i]].classList.add(classHighlightedCodeLine);
    }
    this.currentHighlights = lineNumbers;
  }
  hoverLine(lineNumber) {
    if (!this.isShown) {
      return;
    }
    if (this.currentHover >= 0) {
      this.lines[this.currentHover].classList.remove(classHoveredCodeLine);
    }
    if (lineNumber >= 0) {
      this.lines[lineNumber].classList.add(classHoveredCodeLine);
    }
    this.currentHover = lineNumber;
  }
  show() {
    this.element.classList.remove(classHidden);
    this.isShown = true;
  }
  hide() {
    this.element.classList.add(classHidden);
    this.isShown = false;
    this.hoverLine(-1);
    this.highlightLines([]);
  }
}

class StackTracePage {
  constructor(element) {
    this.element = element;
    this.stackTraces = {};
    this.currentStackTrace = undefined;
    this.codeFiles = {};
    this.currentCodeFile = undefined;
  }
  
  init() {
    const codeFiles = this.element.getElementsByClassName(classCodeFile);
    for (let i = 0; i < codeFiles.length; i++) {
      const codeFile = new CodeFile(codeFiles[i]);
      this.codeFiles[codeFiles[i].getAttribute(attributeDataCodeFilePath)] = codeFile;
      codeFile.init();
      codeFile.hide();
    }
    const stackTraces = this.element.getElementsByClassName(classEntry);
    for (let i = 0; i < stackTraces.length; i++) {
      const stackTrace = new StackTrace(stackTraces[i]);
      this.stackTraces[stackTrace.getId()] = stackTrace;
      stackTrace.init();
      stackTrace.hide();
      if (i !== 0) {
        this.showStackTrace(stackTrace.getId());
      }
    }
  }
  
  showStackTrace(stackTraceId) {
    if (this.currentStackTrace) {
      this.currentStackTrace.hide();
    }
    this.currentStackTrace = this.stackTraces[stackTraceId];
    this.currentStackTrace.show();
    this.hideCodeFile();
  }
  
  hideCodeFile() {
    if (this.currentCodeFile) {
      this.currentCodeFile.hide();
      this.currentCodeFile = undefined;
    }
  }
  
  showCodeFile(codeFilePath, highlightLineNumbers) {
    this.hideCodeFile();
    this.currentCodeFile = this.codeFiles[codeFilePath];
    this.currentCodeFile.highlightLines(highlightLineNumbers);
    this.currentCodeFile.show();
  }
  
  hoverCodeFile(codeFilePath, hoverLineNumber) {
    if (this.codeFiles[codeFilePath] !== this.currentCodeFile) {
      return;
    }
    this.currentCodeFile.hoverLine(hoverLineNumber);
  }
}

const STACK_TRACE_PAGE = new StackTracePage(document.getElementById(idStackTraceWrapper));
STACK_TRACE_PAGE.init();
{{end}}