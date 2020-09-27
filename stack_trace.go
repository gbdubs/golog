package golog

import (
	"github.com/google/uuid"
	"runtime/debug"
	"strconv"
	"strings"
)

type StackTrace struct {
	Id    string
	Lines []LineOfCode
}

type LineOfCode struct {
	Id           string
	StackTraceId string
	FilePath     string
	MethodName   string
	LineNumber   int
}

func createStackTrace() StackTrace {
	return parseStackTrace(string(debug.Stack()))
}

func parseStackTrace(stackTrace string) StackTrace {
	id := uuid.New().String()
	lines := strings.Split(stackTrace, "\n")
	n := (len(lines) - 1) / 2
	st := make([]LineOfCode, n)
	for i := 0; i < n; i++ {
		line1 := lines[i*2+1]
		line2 := lines[i*2+2]
		methodName := trimWhitespace(line1)
		filePath := trimWhitespace(strings.Split(line2, ":")[0])
		lineNumber := trimWhitespace(strings.Split(strings.Split(line2, ":")[1], " ")[0])
		lineNumberAsNumber, err := strconv.Atoi(lineNumber)
		if err != nil {
			panic(err)
		}
		st[i] = LineOfCode{
			Id:           uuid.New().String(),
			StackTraceId: id,
			FilePath:     filePath,
			LineNumber:   lineNumberAsNumber,
			MethodName:   methodName,
		}
	}
	reversedLines := make([]LineOfCode, n)
	for i := 0; i < n; i++ {
		reversedLines[n-i-1] = st[i]
	}
	return StackTrace{
		Id:    id,
		Lines: reversedLines,
	}
}

func trimWhitespace(s string) string {
	return strings.Trim(s, "\n\t ")
}
