require('dotenv').config();
const fs = require('fs').promises;
const qs = require('qs');

const arr = require('./id.js');

let token;

async function login() {
  const data = qs.stringify({
    'username': process.env.maSV,
    'password': process.env.password,
    'grant_type': 'password',
  });

  const config = {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data,
  };

  try {
    const response = await fetch('http://qldt.hanu.vn/api/auth/login', config);
    const result = await response.json();
    token = result.access_token;
    await fs.writeFile('token.txt', token);
    console.log('Token has been written to token.txt');
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

async function callAPI(url, data) {
  const config = {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json();

    // server crash
    if (!result.code) {
      console.log('\n\nServer crash...')
      console.log(result)
      console.log(data)
    }

    // Trung mon...
    if (result.code && result.code !== 200) {
      console.log('\n\nMa mon chua dang ky duoc: ')
      console.log(result)
      console.log(data)
    }

    // Check for error status codes starting with "4" - token error
    if (result.code && result.code.toString().startsWith('4')) {
      console.log('\n\nError with status code:', result.code);
      console.log('Token expired or invalid. Logging in again...');
      await login();

      // Retry the API call with the new token
      return await callAPI(url, data);
    }

    return result;
  } catch (error) {
    console.error('Error while calling the API:', error);
    throw error;
  }
}

async function dangKyMon(listId) {
  const firstId = listId[0];
  const secondArray = [...listId.slice(1)];

  // call first
  const data = {
    filter: {
      id_to_hoc: firstId,
      is_checked: true,
    },
  };
  await callAPI('http://qldt.hanu.vn/api/dkmh/w-xulydkmhsinhvien', data);

  // Create an array of promises for the second array of ids
  const promises = secondArray.map((id) => {
    const data = {
      filter: {
        id_to_hoc: id,
        is_checked: true,
      },
    };
    return callAPI('http://qldt.hanu.vn/api/dkmh/w-xulydkmhsinhvien', data);
  });

  // Wait for all the promises to resolve using Promise.all
  await Promise.all(promises);

  console.log('\nCalling the result API...');
  await ketQuaDangKy();
}

async function ketQuaDangKy() {
  const data = {
    is_CVHT: false,
    is_Clear: false,
  };
  const result = await callAPI('http://qldt.hanu.vn/api/dkmh/w-locdskqdkmhsinhvien', data);

  let extractedData = ''

  // clear
  if (result && result.data && result.data.ds_kqdkmh) {
    extractedData = result.data.ds_kqdkmh.map((item) => {
      return {
        id_to_hoc: item.to_hoc.id_to_hoc,
        ten_mon: item.to_hoc.ten_mon,
      };
    });
  }

  if (!extractedData) {
    console.log('\nKhong the call ket qua')
    console.log(result)
    return
  }

  console.log(`\nTong ${extractedData.length} mon da duoc dang ky`)

  // Write the API response to a file
  try {
    await fs.writeFile('ketQuaDangKy.txt', JSON.stringify(extractedData, null, 2));
    console.log('\nAPI response has been written to ketQuaDangKy.txt');
  } catch (error) {
    console.error('Error writing API response to file:', error);
  }
}

async function run() {
  console.log('\n\n-----------------------\ Start -----------------------\n\n')
  try {
    const tokenFromFile = await fs.readFile('token.txt', 'utf-8');
    token = tokenFromFile.trim();
  } catch (error) {
    console.error('Error reading token from file:', error);
    await login();
  }

  console.log('\nCalling dang ky...');
  await dangKyMon(arr);

  console.log('\nDone.');
}

run();
