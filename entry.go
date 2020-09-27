package golog

import (
	"encoding/json"
	"time"
)

type entry struct {
	LevelAsOrdinal int
	Message        string
	Timestamp      time.Time
	StackTrace     StackTrace
	ArgsAsJson     []string
}

func createEntry(levelAsOrdinal int, message string) *entry {
	return &entry{
		LevelAsOrdinal: levelAsOrdinal,
		Message:        message,
		Timestamp:      time.Now(),
		StackTrace:     createStackTrace(),
	}
}

func createBreakpointEntry(message string, args ...interface{}) *entry {
	e := createEntry(level_nameToOrdinal["BKPT"], message)
	e.ArgsAsJson = make([]string, len(args))
	for i, arg := range args {
		j, err := json.MarshalIndent(arg, "", "  ")
		if err != nil {
			panic(err)
		}
		e.ArgsAsJson[i] = string(j)
	}
	return e
}

func (e *entry) LevelAsName() string {
  return level_ordinalToName[e.LevelAsOrdinal]
}