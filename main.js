require('dotenv').config();
const axios = require('axios')
const arr = require('./id.js')
const qs = require('qs')

let token

async function login() {
	const data = qs.stringify({
		'username': process.env.maSV,
		'password': process.env.password,
		'grant_type': 'password'
	});
	const config = {
		method: 'post',
		url: 'http://qldt.hanu.vn/api/auth/login',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		data: data
	};

	const result = await axios(config)
	token = result.data.access_token
	console.log(token)
}

async function handleArr(listId) {
	for (let id of listId) {
		const data = JSON.stringify({
			filter: {
				id_to_hoc: id,
				is_checked: true,
			},
		})

		const config = {
			method: 'post',
			url: 'http://qldt.hanu.vn/api/dkmh/w-xulydkmhsinhvien',
			headers: {
				Authorization: 'Bearer ' + token,
				'Content-Type': 'application/json',
			},
			data,
		}
		await axios(config)
	}
}

async function run() {
	await login()

	console.log('Calling...')
	await handleArr(arr)

	console.log('Done.')
}

run()