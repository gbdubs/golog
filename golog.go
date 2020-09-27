package golog

import (
	"bufio"
	"fmt"
	"os"
	"text/template"
)

type Golog struct {
	Entries []*entry
	Files   map[string]*codeFile
}

func New() *Golog {
	return &Golog{}
}

func (g *Golog) BreakPoint(message string, args ...interface{}) *Golog {
	g.Entries = append(g.Entries, createBreakpointEntry(message, args...))
	return g
}

func (g *Golog) Fine(format string, a ...interface{}) *Golog {
	return g.appendEntry(level_nameToOrdinal["FINE"], fmt.Sprintf(format, a...))
}

func (g *Golog) Info(format string, a ...interface{}) *Golog {
	return g.appendEntry(level_nameToOrdinal["INFO"], fmt.Sprintf(format, a...))
}

func (g *Golog) Warn(format string, a ...interface{}) *Golog {
	return g.appendEntry(level_nameToOrdinal["WARN"], fmt.Sprintf(format, a...))
}

func (g *Golog) Error(format string, a ...interface{}) *Golog {
	return g.appendEntry(level_nameToOrdinal["ERROR"], fmt.Sprintf(format, a...))
}

func (g *Golog) Fatal(format string, a ...interface{}) *Golog {
	return g.appendEntry(level_nameToOrdinal["FATAL"], fmt.Sprintf(format, a...))
}

func (g *Golog) appendEntry(levelAsOrdinal int, message string) *Golog {
	g.Entries = append(g.Entries, createEntry(levelAsOrdinal, message))
	return g
}

func (g *Golog) Out(w *bufio.Writer) {
	defer w.Flush()
	g.lookupFiles()
	tmpl := template.Must(template.ParseGlob(
		"/Users/gradyward/go/src/github.com/gbdubs/golog/templates/*"))
	err := tmpl.ExecuteTemplate(w, "golog_html", g)
	if err != nil {
		panic(err)
	}
}

func (g *Golog) OutLocal(filePath string) {
	f, err := os.Create(filePath)
	if err != nil {
		panic(err)
	}
	defer f.Close()
	w := bufio.NewWriter(f)
	g.Out(w)
}

func (g *Golog) lookupFiles() {
	result := make(map[string]*codeFile)
	filesToLookup := make([]*codeFile, 0)
	for _, e := range g.Entries {
		for _, loc := range e.StackTrace.Lines {
			fp := loc.FilePath
			_, present := result[fp]
			if !present {
				cf := &codeFile{
					FilePath: fp,
				}
				result[fp] = cf
				filesToLookup = append(filesToLookup, cf)
			}
		}
	}
	lookupAllCodeFiles(filesToLookup)
	g.Files = result
}
