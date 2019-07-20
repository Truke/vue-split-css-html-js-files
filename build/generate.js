'use strict';
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

/**
 * 文件生成器
 */
class FileGenerator {
  constructor(filePath) {
    this.generateFile(filePath);
  }

  /**
   * 生成文件
   * @param {*} filePath 文件路径
   */
  generateFile(filePath) {
    // 切分路径，上一个/后面文件名
    const index = filePath.lastIndexOf('/');
    const fileSourcePath = filePath.slice(0, index).replace('"', '');
  	let fileNamePath = `${filePath.slice(index + 1, filePath.length).replace('"', '')}`;


  	// 去除后缀
  	const pointIndex = fileNamePath.lastIndexOf('.');
  	if (pointIndex !== -1) {
  		fileNamePath = fileNamePath.substr(0, pointIndex);
  		console.log(fileNamePath);
  	}

    const componentName = `${fileSourcePath}/${fileNamePath}.vue`;
    // 检测目标路径是否正确
  	const folderExist = this.checkFolderOrFileExist(fileSourcePath);
  	const folderPath = path.resolve(process.cwd(), fileSourcePath);
    
    if (folderExist && fs.readdirSync(folderPath).length > 0) {
      // 目标路径正确才执行
      const createResult = this.createTemplate(folderPath, fileNamePath);

      if (createResult && createResult.success) {
        console.log('Success 成功创建.vue: ', componentName);
      } else {
        console.log('创建模板文件失败：', createResult && createResult.error)
      }
		  
    } else {
  		// mkdirp.sync(folderPath);
  		console.error(`Error: 请检查路径是否正确`);
      return;
    }

  }

  /**
   * 检测目录是否存在,不存在创建
   * @param {*} fileSourcePath 目录路径
   */
  checkFolderOrFileExist(fileSourcePath) {
	const pathStr = path.resolve(process.cwd(), fileSourcePath);
	console.log(pathStr);
    let result = false;
    try {
      if (fs.existsSync(pathStr)) {
        // file exists
        result = true;
      }
    } catch(err) {
      // console.error(err)
      result = false;
    }
    return result;
  }

  /**
   * 创建模板
   * @param {*} fileSourcePath 路径名
   * @param {*} fileName 文件名
   */
  createTemplate(fileSourcePath, fileName) {
    let result = {
  		success: false
  	};
    try {
      let vueContent = '';

      const template = this.checkFolderOrFileExist(`${fileSourcePath}/${fileName}.jade`)
      const script = this.checkFolderOrFileExist(`${fileSourcePath}/${fileName}.ts`)
      const style = this.checkFolderOrFileExist(`${fileSourcePath}/${fileName}.scss`)
      // 如果存在对应的.jade文件
      if (template) {
        vueContent += `
/** 模板 */
<template src="./${fileName}.jade" lang="jade"></template>\n`;
        
        // 读取并重写jade文件
        let jadeContent = fs.readFileSync(`${fileSourcePath}/${fileName}.jade`, 'utf-8')
        if (/^[script|link].*$/gm.test(jadeContent)) {
          let firstSpace = null
          jadeContent = jadeContent.replace(/^[script|link].*$/gm, '').replace(/^[\r\n]/gm, "").replace(/^\s+/gm,a=>{
            if(firstSpace === null){
              firstSpace = a;
              return ''
            }
            return firstSpace.length > 0 && a.replace(new RegExp(`^${firstSpace}`),'') || a
          }).replace('sspa-view(:id="SSPA_containers.contentWrapper")','router-view')//针对sspa-view
          fs.writeFileSync(`${fileSourcePath}/${fileName}.jade`, jadeContent);
        } else {
          console.log('.jade文件不再重写')
        }
      }
      // 如果存在对应的.ts文件
      if (script) {
        vueContent += `
/** JS */
<script src="./${fileName}.ts" lang="ts"></script>\n`;
        // 读取并重写ts文件
        let tsContent = fs.readFileSync(`${fileSourcePath}/${fileName}.ts`, 'utf-8')
        // 有的是SSSPA.createComponent的写法，有的是export default { template: 'xxx.jade' }的写法 都要重写
        if (/^SSPA.createComponent/gm.test(tsContent)||/\s+template:.*$/gm.test(tsContent)) {
          tsContent = tsContent.replace(/^SSPA.createComponent/gm, 'export default SSPA.createComponent').replace(/\s+template:.*$/gm,'')
          fs.writeFileSync(`${fileSourcePath}/${fileName}.ts`, tsContent);
        } else {
          console.log('.ts文件不再重写')
        }
      }
      // 如果存在对应的.scss文件
      if (style) {
        vueContent += `
/** 样式 */
<style src="./${fileName}.scss" lang="scss"></style>\n`;
      }
      // 主入口文件
      const vuePath = `${fileSourcePath}/${fileName}.vue`;
      fs.writeFileSync(vuePath, vueContent);

      result = {
        success: true
      };
    } catch (error) {
      result = {
        success: false,
        error
	    };
    }

    return result;
  }

}

const splitString = process.env.npm_package_scripts_generate || '';
const splitStringArray = splitString.split(' ');

if (splitStringArray.length > 1) {
  // 拿到用户创建目录
  const filePath = splitStringArray[2];

  // 检测目录
  if (filePath) {
    new FileGenerator(filePath);
  } else {
    console.log('请输入文件路径');
  }
}
