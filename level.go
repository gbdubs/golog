package golog

var level_ordinalToName = map[int]string{
	5: "BKPT",
	4: "FINE",
	3: "INFO",
	2: "WARN",
	1: "ERROR",
	0: "FATAL",
}

var level_nameToOrdinal = map[string]int{
	"BKPT": 5,
	"FINE":       4,
	"INFO":       3,
	"WARN":       2,
	"ERROR":      1,
	"FATAL":      0,
}
