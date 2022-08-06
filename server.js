const express = require('express');
const path = require(`path`);
const bodyParser = require('body-parser');
const app = express();
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const { parse } = require("csv-parse");
const fs = require('fs')
var stringify = require('csv-stringify');

// [START enable_parser]
app.use(bodyParser.urlencoded({ extended: true }));
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false })
// [END enable_parser]

// [STORAGE CONFIG] //
const bucketName = 'rmit_kt_app1';
const myBucket = storage.bucket(bucketName);
const fileName = 'employees.csv';
const bucketEmployee = myBucket.file(fileName);
const destFileName = path.join(__dirname, 'employees.csv')
//

// [ROUTES] //
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/index.html'));
});
app.get('/add', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/add.html'));
});
app.get('/edit', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/edit.html'));
});
app.get('/delete', (req, res) => {
    res.sendFile(path.join(__dirname, '/views/delete.html'));
});
//



// [API HANDLERS] //

//////// ADD ///////
app.post('/addEmployee', (req, res) => {

    const employee = "\n" + req.body.EMPLOYEE_ID + "," + 
    req.body.FIRST_NAME + "," + 
    req.body.LAST_NAME + "," + 
    req.body.EMAIL + "," + 
    req.body.PHONE_NUMBER + "," +
    req.body.HIRE_DATE + "," +
    req.body.JOB_ID + "," +
    req.body.SALARY + "," +
    req.body.COMMISSION_PCT + "," +
    req.body.MANAGER_ID + "," +
    req.body.DEPARTMENT_ID

    console.log(employee) // debug

    const records = [];
    const file = bucketEmployee.createReadStream()
    file.pipe(parse({delimiter: ",", columns: true, skip_empty_lines: true, trim: true}))
    .on('data', (data) => records.push(data))
    .on('end', () => {
        for (let i = 0; i < records.length; i++) {
            let e = records[i]
            console.log(e.EMPLOYEE_ID) // debug
            if (String(e.EMPLOYEE_ID) === String(req.body.EMPLOYEE_ID)) {
                console.log("Employee ID already exist. Please choose another ID") // debug
                res.send("Employee ID already exist. Please choose another ID")
                return;
            }
        }

        let values = ""
        const file = bucketEmployee.createReadStream()
        file.on('data', function(data) {
            values += data;
        })
        .on('end', function() {
            values += employee
            console.log(values) // debug
            bucketEmployee.save(values)
            console.log("Success");
            res.sendFile(path.join(__dirname, '/views/success.html'));
        });
    })

});


//////// UPDATE ///////

app.post('/editEmployee', (req, res) => {
    if (!req.body.EMPLOYEE_ID) { res.send("ERROR: No ID specified") }
    console.log(req.body.EMPLOYEE_ID)// debug
    const id = req.body.EMPLOYEE_ID
    let fname, lname, email, phone, hiredate, jobid, salary, commission, managerid, departmentid = ""
    let employee = null;
    let index = 0;
    const records = [];
    const file = bucketEmployee.createReadStream()
    file.pipe(parse({delimiter: ",", columns: true, skip_empty_lines: true, trim: true}))
    .on('data', (data) => records.push(data))
    .on('end', () => {
        for (let i = 0; i < records.length; i++) {
            let e = records[i]
            if (String(e.EMPLOYEE_ID) === String(req.body.EMPLOYEE_ID)) {
                fname = e.FIRST_NAME
                lname = e.LAST_NAME
                email = e.EMAIL
                phone = e.PHONE_NUMBER
                hiredate = e.HIRE_DATE
                jobid = e.JOB_ID
                salary = e.SALARY
                commission = e.COMMISSION_PCT
                managerid = e.MANAGER_ID
                departmentid = e.DEPARTMENT_ID
                
                if (req.body.FIRST_NAME) {fname = req.body.FIRST_NAME}
                if (req.body.LAST_NAME) {lname = req.body.LAST_NAME}
                if (req.body.EMAIL) {email = req.body.EMAIL}
                if (req.body.PHONE_NUMBER) {phone = req.body.PHONE_NUMBER}
                if (req.body.HIRE_DATE) {hiredate = req.body.HIRE_DATE}
                if (req.body.JOB_ID) {jobid = req.body.JOB_ID}
                if (req.body.SALARY) {salary = req.body.SALARY}
                if (req.body.COMMISSION_PCT) {commission = req.body.COMMISSION_PCT}
                if (req.body.MANAGER_ID) {managerid = req.body.MANAGER_ID}
                if (req.body.DEPARTMENT_ID) {departmentid = req.body.DEPARTMENT_ID}

                index = i; 
                console.log(index) // debug
                employee = req.body.EMPLOYEE_ID + "," + fname + "," + lname + "," + email + "," + phone + "," + hiredate + "," + jobid + "," + salary + "," + commission + "," + managerid + "," + departmentid
            }
        }
        let values = ""
        let finals = ""
        const file = bucketEmployee.createReadStream()
        file.on('data', function (data) {
            values += data
        })
        .on('end', function () {
            values.replace(/^\s*$(?:\r\n?|\n)/gm, "")
            console.log(values) // debug
            let arr = values.split(/\r?\n|\r|\n/g)
            console.log(arr) // debug
            console.log(arr[index+1]) // debug
            // Index + 1 because the original `records` json array did not include the HEADER row
            if (arr[index+1].split(",")[0] === req.body.EMPLOYEE_ID) { 
                if (employee === null) { 
                    console.log("No ID found") // debug
                    res.send("No ID found")
                }
                arr[index+1] = employee
                finals += arr[0]
                arr[0] = ""
                let arr2 = []
                finals.replace(/^\s*$(?:\r\n?|\n)/gm, "")
                for (let i = 1; i < arr.length; i++) {
                    arr2.push(arr[i])
                }
                arr2.forEach((e, i) => finals += "\n" + e)
                finals.replace(/^\s*$(?:\r\n?|\n)/gm, "")
                console.log(finals) // debug
                bucketEmployee.save(finals)
                console.log("Success");
                res.sendFile(path.join(__dirname, '/views/success.html'));
            } else {
                res.send("IDs did not match. Recheck the order of your data file")
            }
        });
    })

});

//////// DELETE ///////

app.post('/deleteEmployee', (req, res) => {
    if (!req.body.EMPLOYEE_ID) { res.send("ERROR: No ID specified") }
    console.log(req.body.EMPLOYEE_ID)// debug
    const id = req.body.EMPLOYEE_ID
    let index = 0;
    const records = [];
    const file = bucketEmployee.createReadStream()
    file.pipe(parse({delimiter: ",", columns: true, skip_empty_lines: true, trim: true}))
    .on('data', (data) => records.push(data))
    .on('end', () => {
        for (let i = 0; i < records.length; i++) {
            let e = records[i]
            if (String(e.EMPLOYEE_ID) === String(req.body.EMPLOYEE_ID)) {
                index = i; 
                console.log(index) // debug
            }
        }
        let values = ""
        let finals = ""
        const file = bucketEmployee.createReadStream()
        file.on('data', function (data) {
            values += data
        })
        .on('end', function () {
            values.replace(/^\s*$(?:\r\n?|\n)/gm, "")
            console.log(values) // debug
            let arr = values.split(/\r?\n|\r|\n/g)
            console.log(arr) // debug
            console.log(arr[index+1]) // debug
            // Index + 1 because the original `records` json array did not include empty lines (the last \n )
            if (arr[index+1].split(",")[0] === req.body.EMPLOYEE_ID) { 
                arr[index+1] = ""

                for (let i = index+1; i < arr.length - 1; i++) {
                    arr[i] = arr[i+1]
                }
                
                let arr2 = []
                for (let i = 0; i < arr.length - 1; i++) {
                    arr2.push(arr[i])
                }
                
                finals += arr2[0]
                
                let arr3 = []
                for (let i = 1; i < arr2.length; i++) {
                    arr3.push(arr2[i])
                }

                arr3.forEach((e,i) =>  finals += "\n" + e)
                finals.replace(/^\s*$(?:\r\n?|\n)/gm, "")

                console.log(finals) // debug
                bucketEmployee.save(finals)
                console.log("Success");
                res.sendFile(path.join(__dirname, '/views/success.html'));
            } else {
                res.send("IDs did not match. Recheck the order of your data file")
            }
        });
    })

});


//////// GET ///////

app.get('/getCSV', (req, res) => {
    const records = [];
    const file = bucketEmployee.createReadStream()
    file.pipe(parse({delimiter: ",", columns: true, skip_empty_lines: true, trim: true}))
    .on('data', (data) => records.push(data))
    .on('end', () => {
        res.json(records)
    })

    
})
//

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});
// [END app]

module.exports = app;