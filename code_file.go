package golog

import (
	"io/ioutil"
	"strings"
)

type codeFile struct {
	FilePath string
	Lines    []string
}

func (cf *codeFile) lookup(c chan error) {
	content, err := ioutil.ReadFile(cf.FilePath)
	if err == nil {
		cf.Lines = strings.Split(string(content), "\n")
	}
	c <- err
}

func lookupAllCodeFiles(cfs []*codeFile) {
	c := make(chan error)
	for _, cf := range cfs {
		go cf.lookup(c)
	}
	for range cfs {
		err := <-c
		if err != nil {
			panic(err)
		}
	}
}
