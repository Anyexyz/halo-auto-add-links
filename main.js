const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const https = require('https');
var request = require('request');


function searchFriendUrl(url, friendUrl) {  // 检查url页面中是否包含friendUrl
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let rawData = '';

            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const data = rawData.toString();
                    // 检查返回的内容中是否包含friendUrl
                    if (data.includes(friendUrl)) {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function add_Friendlink(websiteName, websiteURL, websiteDescription, websiteLogo) {
    var options = {
        method: 'POST',
        url: process.env.url + '/apis/core.halo.run/v1alpha1/links',
        headers: {
            'Authorization': 'Bearer ' + process.env.pat,
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
            "apiVersion": "core.halo.run/v1alpha1",
            "kind": "Link",
            "metadata": {
                "annotations": {},
                "generateName": "link-",
                "name": websiteName // 使用 websiteName 作为 name 属性
            },
            "spec": {
                "description": websiteDescription,
                "displayName": websiteName,
                "groupName": process.env.group,
                "logo": websiteLogo,
                "url": websiteURL
            }
        })
    };
    request(options);
}

const app = express();

// 配置body-parser中间件来解析表单数据
app.use(bodyParser.urlencoded({ extended: true }));

// 定义一个路由来显示表单页面
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <style>
                .link-index {
                    width: 500px;
                    border: 1px solid black;
                    margin: 0 auto;
                    padding: 5px 5px;
                }
                .link-index p {
                    margin: 10px;
                }
                .link-index input {
                    width: 100%;
                    height: 30px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    font-size: 16px;
                    box-sizing: border-box;
                }
                .link-index button {
                    width: 100%;
                    height: 30px;
                    font-size: 16px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    margin-top: 10px;
                    box-sizing: border-box;
                }
            </style>
            <script>
                function submitForm(event) {
                    event.preventDefault();
                    var websiteName = document.getElementById('websiteName').value;
                    var websiteURL = document.getElementById('websiteURL').value;
                    var websiteDescription = document.getElementById('websiteDescription').value;
                    var websiteLogo = document.getElementById('websiteLogo').value;
                    var friendLinkURL = document.getElementById('friendLinkURL').value;

                    // 发起POST请求到当前URL的'/submit'路径
                    fetch('/submit', {
                        method: 'POST',
                        body: new URLSearchParams({
                            websiteName: websiteName,
                            websiteURL: websiteURL,
                            websiteDescription: websiteDescription,
                            websiteLogo: websiteLogo,
                            friendLinkURL: friendLinkURL
                        }).toString(),
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            alert('友链申请已提交，请刷新后在页面中查看');
                        } else {
                            alert('友链提交失败：' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                    });
                }
            </script>
        </head>
        <body>
        <form class="link-index" action="" target="_blank" method="get" onsubmit="submitForm(event)">
                <p>网站名称：</p>
                <input type="text" name="websiteName" id="websiteName" placeholder="请填写你的网站名称" required>
                <p>网站地址：</p>
                <input type="text" name="websiteURL" id="websiteURL" placeholder="请填写你的网站地址" required>
                <p>网站简介：</p>
                <input type="text" name="websiteDescription" id="websiteDescription" placeholder="请填写你的网站简介" required>
                <p>网站LOGO：</p>
                <input type="text" name="websiteLogo" id="websiteLogo" placeholder="请填写你的网站LOGO" required>
                <p>友链地址：</p>
                <input type="text" name="friendLinkURL" id="friendLinkURL" placeholder="请填写你的友链地址" required>
                <button type="submit">立即提交</button>
            </form>
        </body>
        </html>
    `);
});

// 定义一个路由来处理表单提交
app.post('/submit', (req, res) => {
    const formData = req.body;
    const websiteName = formData.websiteName;
    const websiteURL = formData.websiteURL;
    const websiteDescription = formData.websiteDescription;
    const websiteLogo = formData.websiteLogo;
    const friendLinkURL = formData.friendLinkURL;
    searchFriendUrl(friendLinkURL, process.env.url)
        .then((exists) => {
            if (exists) {
                searchFriendUrl(process.env.link_url, websiteURL)
                    .then((exists) => {
                        if (exists) {
                            res.json({ status: 'error', message: '您的友链已添加' });
                        } else {
                            add_Friendlink(websiteName, websiteURL, websiteDescription, websiteLogo)
                            res.json({ status: 'success' });
                        }
                    })
                    .catch((error) => {
                        console.error('An error occurred:', error);
                        res.json({ status: 'error', message: '检查友链时出现错误' });
                    });
            } else {
                res.json({ status: 'error', message: '未在您的友链页面中找到本站链接，请检查友链是否已添加' });
            }
        })
        .catch((error) => {
            console.error('An error occurred:', error);
            res.json({ status: 'error', message: '检查友链时出现错误' });
        });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});