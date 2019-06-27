const fs         = require('fs');
const fetch      = require('node-fetch');

const { config } = require('./config.js');


async function getFigmaObjTree(figmaApiKey, figmaId, figmaLink) {
  let result = await fetch(figmaLink + figmaId, {
      method: "GET",
      headers: {
          "X-Figma-Token": figmaApiKey
      }
  });


  const figmaTreeStructure = await result.json();

  const pages = figmaTreeStructure.document.children;


    let baseTokeensJSON = {
      props: getTokens(pages)
    };


  return JSON.stringify(baseTokeensJSON, null, 2);
}

function getTokens(pages) {
    const props = [];

    pages.forEach(page => {
      page.children.forEach(artboard => {
        if (artboard.name[0] === '_') return;

        artboard.children.forEach(group => {
          if (group.type !== 'GROUP') return;

          group.children.forEach(layer => {
            if (layer.name[0] !== '$') return;

            let token = {
              name: layer.name.substr(1),
              value: layer.characters,
              type: group.name,
              category: artboard.name
            };

            props.push(token);
          });
        });
      })
    });


    return props;
}


async function getToken() {
  const tree = await getFigmaObjTree(config.figmaApiKey, config.figmaId, config.figmaLink);

  fs.writeFile('./figma_tokens/styles.json', tree, err => {
    if (err) console.log('Error writing file', err)
  });
}

module.exports.getToken = getToken;
