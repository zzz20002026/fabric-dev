const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

// use bodyParser middleware 
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);
app.use(bodyParser.json());

// setup static directory
app.use(express.static('./public'));

//偵測連線，並傳入一個callback function
const port = process.env.PORT || 8080;

// Server stsrt and listening specified port
app.listen(port, () => {
    console.info(`Listening on port ${port}...`);
    console.info(`Press Ctrl+C to terminate.`);
});


// ==== 設定API Server Router ====
// homepage
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/" + "index.htm");
});

app.post('/queryCar', (req, res) => {
    try {
        //POST參數
        const carId = req.body.carID;
        
        //資料檢查
        if (!carId) {
            console.error(`carID不存在請重新輸入`)
            throw new Error(`carID不存在請重新輸入`);
        }

        const connect = require('./lib/queryCar.js');
        connect.queryCar(carId).then(function (data) {
            res.status(data.status).send(data.data);
        });
        
        // const args = [carId];
        // const connect = require('./lib/connect.js');
        // connect.executeChaincode("queryCar", args).then(function (data) {
        //    res.status(data.status).send(data.data);
        // });
    } catch (error) {
        console.log("queryCar error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    }
});

app.post('/queryCarPrice', (req, res) => {
    try {
        //POST參數
        const carId = req.body.carID;
        
        //資料檢查
        if (!carId) {
            console.error(`必要的傳入參數不存在請重新輸入`)
            throw new Error(`必要的傳入參數不存在請重新輸入`);
        }

        const args = [carId];
        const connect = require('./lib/connect.js');
        connect.executeChaincode("queryCarPrice", args).then(function (data) {
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("queryCarPrice error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    } 
});

app.post('/queryCarMFGDate', (req, res) => {
    try {
        //POST參數
        const carId = req.body.carID;
        
        //資料檢查
        if (!carId) {
            console.error(`必要的傳入參數不存在請重新輸入`)
            throw new Error(`必要的傳入參數不存在請重新輸入`);
        }

        const args = [carId];
        const connect = require('./lib/connect.js');
        connect.executeChaincode("queryCarMFGDate", args).then(function (data) {
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("queryCarMFGDate error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    } 
});

app.post('/createCar', (req, res) => {
    try {
        //POST參數
        const carId = req.body.carID;
        const brand = req.body.carBrand;
        const model = req.body.carModel;
        const color = req.body.carColor;
        const owner = req.body.carOwner;
        const price = req.body.carPrice;
        const mfgDate = req.body.carMfgDate;
        
        //資料檢查
        if (!carId || !brand || !model || !color || !owner || !price || !mfgDate) {
            console.error(`必要的傳入參數不存在請重新輸入`)
            throw new Error(`必要的傳入參數不存在請重新輸入`);
        }

        //設定參數陣列
        const args = [carId, brand, model, color, owner, price, mfgDate];
        //載入connect.js中介模組
        const connect = require('./lib/connect.js');
        //調用智慧合約函式
        connect.executeChaincode("createCar", args).then(function (data) {
            //將智慧合約執行結果回傳前端網頁
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("createCar error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    } 
});

app.post('/updateCarPrice', (req, res) => {
    try {
        //POST參數
        const carId = req.body.carID;
        const price = req.body.carNewPrice;
        
        //資料檢查
        if (!carId || !price) {
            console.error(`必要的傳入參數不存在請重新輸入`)
            throw new Error(`必要的傳入參數不存在請重新輸入`);
        }

        const args = [carId, price];
        const connect = require('./lib/connect.js');
        connect.executeChaincode("updateCarPrice", args).then(function (data) {
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("updateCarPrice error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    } 
});

app.post('/transferCar', (req, res) => {
    try {
        //POST參數
        const carId = req.body.carID;
        const newOwner = req.body.carNewOwner;
        
        //資料檢查
        if (!carId || !newOwner) {
            console.error(`必要的傳入參數不存在請重新輸入`)
            throw new Error(`必要的傳入參數不存在請重新輸入`);
        }

        const args = [carId, newOwner];
        const connect = require('./lib/connect.js');
        connect.executeChaincode("transferCar", args).then(function (data) {
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("transferCar error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    } 
});

app.post('/deleteCar', (req, res) => {
    try {
        //POST參數
        const carId = req.body.carID;
        
        //資料檢查
        if (!carId) {
            console.error(`必要的傳入參數不存在請重新輸入`)
            throw new Error(`必要的傳入參數不存在請重新輸入`);
        }

        const args = [carId];
        const connect = require('./lib/connect.js');
        connect.executeChaincode("deleteCar", args).then(function (data) {
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("deleteCar error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    }
});

app.post('/queryCarPriceByRange', (req, res) => {
    try {
        //POST參數
        const startCarId = req.body.startCarID;
        const endCarId = req.body.endCarID;
        
        //資料檢查
        if (!startCarId || !endCarId) {
            console.error(`必要的傳入參數不存在請重新輸入`)
            throw new Error(`必要的傳入參數不存在請重新輸入`);
        }

        const args = [startCarId, endCarId];
        const connect = require('./lib/connect.js');
        connect.executeChaincode("queryCarPriceByRange", args).then(function (data) {
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("queryCarPriceByRange error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    }
});

app.post('/queryAllCarPrice', (req, res) => {
    try {
        const args = ['', ''];
        const connect = require('./lib/connect.js');
        connect.executeChaincode("queryCarPriceByRange", args).then(function (data) {
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("queryAllCarPrice error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    }
});

app.post('/queryCarByPrice', (req, res) => {
    try {
        //POST參數
        const price = req.body.carPrice;
        
        //資料檢查
        if (!price) {
            console.error(`必要的傳入參數不存在請重新輸入`)
            throw new Error(`必要的傳入參數不存在請重新輸入`);
        }

        const args = [price];
        const connect = require('./lib/connect.js');
        connect.executeChaincode("queryCarByPrice", args).then(function (data) {
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("queryCarByPrice error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    }
});

app.post('/queryCarHistory', (req, res) => {
    try {
        //POST參數
        const carId = req.body.carID;
        
        //資料檢查
        if (!carId) {
            console.error(`必要的傳入參數不存在請重新輸入`)
            throw new Error(`必要的傳入參數不存在請重新輸入`);
        }

        const args = [carId];
        const connect = require('./lib/connect.js');
        connect.executeChaincode("queryCarHistory", args).then(function (data) {
            res.status(data.status).send(data.data);
        });

    } catch (error) {
        console.log("queryCarHistory error");
        console.error("message: "+ error.message);
        //console.error("stack: "+ error.stack);
        const errorObj = {
            status: 500, 
            message: error.message
        }
        //當網頁程式發生錯誤正確作法應回傳狀態碼400或500
        //此處因範例為了故意要將錯誤訊息顯示於網頁
        //因此仍回傳狀態碼200
        res.status(200).send(JSON.stringify(errorObj));
    }
});


// catch 404 and forward to error handler
//app.use(function (req, res) {
app.use((req, res, next) => {
    res.type('text/plain');
    res.status(404);
    res.send('404 Resource Not Found.');
});

// error handler
app.use((err, req, res, next) => {
    console.error(err.message);
    console.error(err.stack);
    res.status(500);
    res.send('500 Server Error.');
});

module.exports = app;