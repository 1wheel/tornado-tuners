import csv
from datetime import datetime
from dateutil.relativedelta import relativedelta
from sets import Set

#loads csv file
def parseCSV(fileName):

	with open(fileName, 'rb') as csvfile:
		reader = csv.reader(csvfile, delimiter=',', quotechar='"')
		columnTitles = reader.next()
		data = []
		for r in reader:

			nextRow = {}
			for i in range(0, len(columnTitles)):
				varName = str(columnTitles[i])
				nextRow[varName] = r[i]
			data.append(nextRow)

	print 'read ' + fileName
	return data

allTornadoA = parseCSV('rawdata/1950-2012_torn_modified.csv')

stateTornadoObject = {}
for row in allTornadoA:
	key = row['om'] + row['year']
	if key not in stateTornadoObject:
		stateTornadoObject[key] = set()

	stateTornadoObject[key].add(row['state'])

for row in allTornadoA:
	row['states'] = ' '.join([state for state in stateTornadoObject[row['om'] + row['year']]])

writeKeys = ['time', 'states', 'fscale', 'inj', 'fat', 'loss', 'slat', 'slon', 'elat', 'elon', 'length', 'width']

filteredA =	filter(	lambda d: d['sg'] == '1'
						and  d['elon'] != '0'
						and  d['fscale'] != '-9', 
					allTornadoA)

with open('webpage/filteredTornados.csv', 'wb') as csvfile:
    writer = csv.writer(csvfile, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
    writer.writerow(writeKeys)
    for row in filteredA:
    	nextRow = []
    	for key in writeKeys:
    		nextRow.append(row[key])
    	writer.writerow(nextRow)

