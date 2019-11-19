const inquirer = require('inquirer');
const fs = require('fs');
const axios = require('axios');
const generateHTML = require("./assets/js/generateHTML.js");
const util = require('util');
const Puppeteer = require('puppeteer');  

const writeFileAsync = util.promisify(fs.writeFile);
const rmFileAsync = util.promisify(fs.unlink);

const questions = [
    {
        type:"input",
        message:"What is the GitHub Username you would like to use?",
        name:"username"
    },
    {
        type:"input",
        message:"What colour would you like to use for the cards? [green,blue,pink,red]",
        name:"colour"
    }
];

async function writeToFile(fileName, data) {

    try{
        let pdfPage = await pdf(data);
        writeFileAsync(fileName,pdfPage).then(err =>{
            if(err){
                console.log(`write failed: ${err}`);
            }
            console.log("success");
        });
    }catch (error){
        console.log(error);
    }
}

function init() {  
    let colour ="";
    let username = "";
    let stars = 0;
    inquirer
    .prompt(questions)
    .then( answers => {
        
        username = answers.username;
        colour = answers.colour;
        if (generateHTML.colors.hasOwnProperty(colour)){       
            //const queryUrl = `https://api.github.com/users/${username}/repos`; //repos for stars for others
            const queryUrl = `https://api.github.com/users/${username}/starred?per_page=1`;
            return axios.head(queryUrl);
        }else{
            throw Error("not a valid colour");
        }        
    })
    .then( data =>{   
        
        return Promise.resolve(getStarredCount(data));   
        //return Promise.resolve(countStars(data));
    })    
    .then(data =>{
        stars = data;
        const queryUrl = `https://api.github.com/users/${username}`;
        return axios.get(queryUrl);
        //return Promise.resolve({gitUser:axios.get(queryUrl),stars:data});
    })
    .then(({data})=>{
        return Promise.resolve(parseGitUser(data,colour,stars));
    })
    .then(htmlData=>{
        return Promise.resolve({html:generateHTML.generateHTML(htmlData),name:htmlData.name});
    })   
    .then( ({html,name}) =>{
        return writeToFile(`${name}.pdf`,html);
    })
    .then(function(){
        return rmFileAsync('./output.png', err=>{if(err)console.log(err)})
    })    
    .catch(err =>{
        console.log(err);
    });

   
}

async function pdf(html) {   
    
    const browser = await Puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);
    await page.emulateMedia("screen");
    await page.screenshot({ path: 'output.png' });
    const pdf = await page.pdf();
    browser.close();
    return pdf
}

function countStars(data){ 
           
        let count = 0;
        data.forEach(element =>{
            count += element.stargazers_count;
            
        });
        
        return count;     
}
function getStarredCount(data){
    let linkStr = data.headers.link;
    if(!linkStr){
        return 0;
    }    
    return parseInt(linkStr.match(/\d+(?=(>; rel="last"))/g)[0])
    
}

function parseGitUser(data,colour,stars){
    
    return {
        url: data.html_url,
        color: colour,
        name: data.name,
        location: data.location,
        repos: data.public_repos,
        followers: data.followers,
        following: data.following,
        pic: data.avatar_url,
        blog: data.blog,
        company: data.company,
        bio: data.bio,
        username:data.login,
        stars:stars
    }
}

init();
