const fs = require('fs')
const path = require('path')
const sha1 = require('sha1')
const express = require('express')
const router = express.Router()

const UserModel = require('../models/users')
const checkNotLogin = require('../middlewares/check').checkNotLogin

router.get('/',checkNotLogin,function(req, res, next){
    // res.send('注册页')
    res.render('signup')
})

router.post('/',checkNotLogin,function(req, res, next){
    // res.send('注册')
    const name = req.fields.name
    const gender = req.fields.gender
    const bio = req.fields.bio
    const avatar = req.files.avatar.path.split(path.sep).pop()
    let password = req.fields.password
    const reqpassword = req.fields.password

    try{
        if(!(name.length >= 1 && name.length <= 10)){
            throw new Error('名字请限制在 1-10 个字符')
        }
        if(['m', 'f', 'x'].indexOf(gender) === -1){
            throw new Error('性别只能是 m,f,x')
        }
        if(!(bio.length >= 1 && bio.length <= 30)){
            throw new Error('个人简介请限制在 1-30 个字符')
        }
        if(!req.files.avatar.name){
            throw new Error('缺少头像')
        }
        if(password.length < 6){
            throw new Error('密码至少 6 个字符')
        }
        if(password !== reqpassword){
            throw new Error('两次输入密码不一致')
        }
    }catch(e){
        fs.unlink(req.files.avatar.path,function(err){
            if(err)
                throw new Error('清除文件失败')
        })
        req.flash('error',e.message)
        return res.redirect('/signup')
    }

    password = sha1(password)

    let user = {
        name: name,
        password: password,
        gender: gender,
        bio: bio,
        avatar: avatar,
    }

    UserModel.create(user)
    .then(function(result){
        user = result.ops[0]
        delete user.password
        req.session.user = user
        req.flash('success','注册成功')
        res.redirect('/posts')
    })
    .catch(function(e){
        fs.unlink(req.files.avatar.path,function(err){
            if(err)
                throw new Error('清除文件失败')
        })

        if(e.message.match('duplicate key')){
            req.flash('error','用户名已被占用')
        }
        next(e)
    })
})

module.exports = router