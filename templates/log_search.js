{{define "log_search_js"}}
/* log_search.js */

const idLogSearchWrapper = "log-search";
// Defined elsewhere: const idStackTraceWrapper = "stack-trace";

const classForFilterInput = "log-filter-input";
const classForEvenRows = "even-row";
const classForHiddenRows = "hidden";
const classForHighlightedContent = "highlighted";
const classForSortToggles = "sort-toggle";
const classForStackTraceLink = "stack-trace-link";

const attributeForDataContent = "data-content";
const attributeForDataSort = "data-sort";
const attributeForDataSortedAt = "data-sorted-at";
const attributeForDataOriginalIndex = "data-original-index";
const attributeForDataStackTraceId = "data-stack-trace-id";

class LogSearch {
  
  constructor(element) {
    this.element = element;
    this.filterInput = element.getElementsByClassName(classForFilterInput)[0];
  }
  
  init() {
    this.initFilter();
    this.initSorting();
    this.initStackTraceLinks();
    this.refreshRowsByRegex();
  }
  
  initFilter() {
    const ls = this;
    this.filterInput.onchange = () => { ls.refreshRowsByRegex() };
  }
  
  initSorting() {
    const ls = this;
    const sortToggles = this.element.getElementsByClassName(classForSortToggles);
    const sortOrdinalToName = {
      0: "None",
      1: "Asc",
      2: "None",
      3: "Desc",
    };
    for (let i = 0; i < sortToggles.length; i++) {
      sortToggles[i].setAttribute(attributeForDataSort, 0);
      sortToggles[i].onclick = function () {
        const currentSort = parseInt(this.getAttribute(attributeForDataSort));
        const nextSort = (currentSort + 1) % 4;
        this.setAttribute(attributeForDataSort, nextSort);
        this.setAttribute(attributeForDataSortedAt, new Date().getTime());
        this.innerHTML = "(" + sortOrdinalToName[nextSort] + ")" ;
        ls.refreshRowsBySort();
      }
    }
  }
  
  initStackTraceLinks() {
    const stackTraceLinks = this.element.getElementsByClassName(classForStackTraceLink);
    for (let i = 0; i < stackTraceLinks.length; i++) {
      const stackTraceLinkElement = stackTraceLinks[i];
      const stackTraceId = stackTraceLinkElement.getAttribute(attributeForDataStackTraceId);
      stackTraceLinkElement.onclick = (e) => {
        e.preventDefault();
        STACK_TRACE_PAGE.showStackTrace(stackTraceId);
        GOLOG.showSpecificTool(idStackTraceWrapper);
      };
    }
  }
  
  refreshRowsByRegex() {
    const filterString = this.filterInput.value ? this.filterInput.value.trim() : "";
    const regex = new RegExp("(" + filterString + ")", "g");  
    const highlightRegexMatches = filterString != "";
    const trs = this.element.getElementsByTagName("tr");
    // Skips the header row.
    for (let i = 1; i < trs.length; i++) {
      const tr = trs[i];
      const tds = tr.getElementsByTagName("td");
      let isCurrentRowShown = false;
      // Skip the Stack Trace Link Column
      for (let j = 1; j < tds.length; j++) {
        const td = tds[j];
        let cellContents = td.getAttribute(attributeForDataContent);
        if (regex.test(td.innerText)) {
          isCurrentRowShown = true;
          if (highlightRegexMatches) {
            const replacement = "<span class=\""+classForHighlightedContent+"\">$1</span>"
            cellContents = cellContents.replace(regex, replacement)
          } 
        }
        td.innerHTML = cellContents;
      }
      if (isCurrentRowShown) {
        tr.classList.remove(classForHiddenRows)
      } else {
        tr.classList.add(classForHiddenRows)
      }
    }
    this.refreshRowEvenOddColoring();
  }

  refreshRowsBySort() {
    const sortToggles = this.element.getElementsByClassName(classForSortToggles);
    const sorts = [];
    for (let i = 0; i < sortToggles.length; i++) {
      let currentSort = sortToggles[i].getAttribute(attributeForDataSort);
      currentSort = currentSort ? currentSort : "0";
      // Sort for ordinals 0 and 2 is "None", see sortOrdinalToName
      if (currentSort != "0" && currentSort != "2") {
        const timeSortedAt = sortToggles[i].getAttribute(attributeForDataSortedAt);
        sorts.push({
          sortedAt: timeSortedAt,
          sort: currentSort,
          index: i,
        });
      }
    }
    sorts.sort((s1, s2) => {
      // Preferences the most recent sort actions by the user.
      return s2.sortedAt - s1.sortedAt;
    })
    const comparator = (tr1, tr2) => {
      const tds1 = tr1.getElementsByTagName("td");
      const tds2 = tr2.getElementsByTagName("td");
      for (let i = 0; i < sorts.length; i++) {
        const sort = sorts[i];
        // The Stack Trace Column does not have sorting.
        const idx = sort.index + 1;
        const val1 = tds1[idx].getAttribute(attributeForDataContent);
        const val2 = tds2[idx].getAttribute(attributeForDataContent);
        const diff = val1.localeCompare(val2);
        if (diff == 0) {
          continue;
        }
        if (sort.sort == "1") {
          return diff;
        } else {
          return -1 * diff;
        }
      }
      const origIdx1 = parseInt(tr1.getAttribute(attributeForDataOriginalIndex));
      const origIdx2 = parseInt(tr2.getAttribute(attributeForDataOriginalIndex));
      return origIdx1 - origIdx2;
    }
  
    const table = this.element.getElementsByTagName("table")[0];
    const trElements = this.element.getElementsByTagName("tr");
    const trs = [];
    // Skips the header row.
    for (let i = 1; i < trElements.length; i++) {
      trs.push(trElements[i]);
    }
    trs.sort(comparator);
    trs.forEach(tr => {
      tr.remove();
      table.appendChild(tr);
    });
    this.refreshRowEvenOddColoring();
  }
    
  refreshRowEvenOddColoring() {
    let isCurrentRowEven = true;
    const trs = this.element.getElementsByTagName("tr");
    // Skip the header row.
    for (let i = 1; i < trs.length; i++) {
      const tr = trs[i];
      const isCurrentRowShown = !tr.classList.contains(classForHiddenRows)
      if (isCurrentRowShown) {
        isCurrentRowEven = !isCurrentRowEven;
      }
      if (isCurrentRowEven) {
        tr.classList.add(classForEvenRows)
      } else {
        tr.classList.remove(classForEvenRows)
      }
    }
  }
}

const LOG_SEARCH = new LogSearch(document.getElementById(idLogSearchWrapper));
LOG_SEARCH.init();

{{end}}