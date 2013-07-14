import csv
from datetime import datetime
from dateutil.relativedelta import relativedelta

#loads csv file,
def parseCSV(fileName):

	with open(fileName, 'rb') as csvfile:
		reader = csv.reader(csvfile, delimiter=',', quotechar='"')
		columnTitles = reader.next()
		data = []
		for r in reader:

			nextRow = {}
			for i in range(0,len(columnTitles)):
				varName = str(columnTitles[i])
				nextRow[varName] = r[i]
			data.append(nextRow)

	print 'read ' + fileName
	return data

emmiArray = parseCSV('AllClients_ResearchData.csv')

emmiDateFields = {'DATE_ISSUED':	'eIssued', 'eStarted_DT':	'eStarted'}
keyFields = ['ORGANIZATION_NM', 'FIRST_NM', 'LAST_NM', 'DOB']
invalidStartDate = datetime.strptime('5/7/4013', "%m/%d/%Y")

emmiObject = {}
for row in emmiArray:

	if row['FIRST_NM'] != 'UNKNOWN':
		row['eIssued']  = datetime.strptime(row['DATE_ISSUED'], "%m/%d/%Y")
		row['eViewBy']  = datetime.strptime(row['VIEW_BY_DT'], "%m/%d/%Y") + relativedelta(days=3, months=1)
		try:
			row['eStarted'] = datetime.strptime(row['DATE_STARTED'], "%m/%d/%Y")
		except Exception:
			row['eStarted'] = invalidStartDate

		key = ''
		for field in keyFields:
			key = key + row[field]

		if key not in emmiObject:
			emmiObject[key] = []

		emmiObject[key].append(row)

pArray = []
for key in emmiObject:
	pArray.append(emmiObject[key])

#hist(map(lambda d: len(d), filter(lambda d: len(d) < 15, pArray)), bins=14)

unoStartDate = datetime.strptime('6/23/2013', "%m/%d/%Y")

gridSize = 10
preUno  = []
postUno = []
for i in range(gridSize):
	nextPreRow = []
	nextPostRow = []
	for j in range(gridSize):
		nextPreRow.append(0)
		nextPostRow.append(0)

	preUno.append(nextPreRow)
	postUno.append(nextPostRow)

excludedSizeStarts = 0
excludedDateStarts = 0

viewable = 0
viewed = 0
for accessCode in patientRecord
	if  accessCode['eStarted'] >= viewingDay 
	and accessCode['eViewBy']  >= viewingDay 
	and accessCode['eIssued']  <= viewingDay:
		viewable = viewable + 1
	
	if  accessCode['eStarted'] == viewingDay:
		viewed = viewed + 1


for p in pArray:
	viewDays = set(map(lambda d: d['eStarted'], p)).difference(set([invalidviewDay]))
	for viewDay in viewDays:

		viewable = 0
		viewed = 0
		for accessCode in patientRecord
			if  accessCode['eStarted'] >= viewDay 
			and accessCode['eViewBy']  >= viewDay 
			and accessCode['eIssued']  <= viewDay:
				viewable = viewable + 1
			
			if  accessCode['eStarted'] == viewDay:
				viewed = viewed + 1

		if viewable < viewed:
			excludedDateStarts = excludedDateStarts + viewed
		elif gridSize <= viewable:
			excludedSizeStarts = excludedSizeStarts + viewed
		else:
			if viewDay < unoStartDate:
				preUno[viewable][viewed] = preUno[viewable][viewed] + 1
			else:
				postUno[viewable][viewed] = postUno[viewable][viewed] + 1				