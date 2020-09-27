{{define "golog_js"}}
/* golog.js */

const classForToolButtons = "tool-button";
const classForTools = "tool";
const classForSelectedTools = "selected"

const attributeForDataTool = "data-tool";

class Golog {
  constructor(element) {
    this.element = element;
    this.toolButtons = element.getElementsByClassName(classForToolButtons);
    this.tools = element.getElementsByClassName(classForTools);
  }
  init() {
    const g = this;
    const toolButtons = this.element.getElementsByClassName(classForToolButtons);
    for (let i = 0; i < toolButtons.length; i++) {
      const toolButton = toolButtons[i];
      toolButton.onclick = () => {
        g.showSpecificTool(toolButton.getAttribute(attributeForDataTool));
      }
    }
  }
  showSpecificTool(toolName) {
    for (let i = 0; i < this.toolButtons.length; i++) {
      if (this.toolButtons[i].getAttribute(attributeForDataTool) === toolName) {
        this.toolButtons[i].classList.add(classForSelectedTools);
      } else {
        this.toolButtons[i].classList.remove(classForSelectedTools);
      }
    }
    for (let i = 0; i < this.tools.length; i++) {
      if (this.tools[i].id === toolName) {
        this.tools[i].classList.add(classForSelectedTools);
      } else {
        this.tools[i].classList.remove(classForSelectedTools);
      }
    }
  }
}

const GOLOG = new Golog(document);
GOLOG.init();

{{end}}