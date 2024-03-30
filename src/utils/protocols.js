
function addSchemas(config) {
  const types = config.types;
  const protocolUri = config.protocol;
  return Object.entries(types).reduce((result, [key, value]) => {
    if (value.dataFormats.some(format => format.match('json'))) {
      result[key] = types[key].schema = protocolUri + '/schemas/' + key;
    }
    return result;
  }, {})
}


const socialDefinition = {
  published: true,
  protocol: 'https://areweweb5yet.com/protocols/social',
  types: {
    "aggregators": {
      "dataFormats": ["application/json"]
    },
    "follows": {
      "dataFormats": ["application/json"]
    },
    "post": {
      "dataFormats": ["application/json"]
    },
    "media": {
      "dataFormats": ["image/gif", "image/png", "image/jpeg", "video/mp4"]
    },
    "reply": {
      "dataFormats": ["application/json"]
    }
  },
  structure: {
    aggregators: {},
    follows: {},
    post: {
      media: {
        $actions: [
          {
            who: 'author',
            of: 'post',
            can: ['create', 'update']
          }
        ]
      },
      reply: {
        $actions: [
          {
            who: 'anyone',
            can: ['create', 'update']
          }
        ],
        media: {
          $actions: [
            {
              who: 'author',
              of: 'post/reply',
              can: ['create', 'update']
            }
          ]
        }
      }
    }
  }
}

const profileDefinition = {
  published: true,
  protocol: "https://areweweb5yet.com/protocols/profile",
  types: {
    name: {
      dataFormats: ['application/json']
    },
    social: {
      dataFormats: ['application/json']
    },
    messaging: {
      dataFormats: ['application/json']
    },
    phone: {
      dataFormats: ['application/json']
    },
    address: {
      dataFormats: ['application/json']
    },
    career: {
      dataFormats: ['application/json']
    },
    avatar: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    },
    hero: {
      dataFormats: ['image/gif', 'image/png', 'image/jpeg']
    }
  },
  structure: {
    name: {},
    social: {},
    career: {},
    avatar: {},
    hero: {},
    messaging: {},
    address: {},
    phone: {}
  }
}

export const profile = {
  uri: profileDefinition.protocol,
  schemas: addSchemas(profileDefinition),
  definition: profileDefinition
}

export const social = {
  uri: socialDefinition.protocol,
  schemas: addSchemas(socialDefinition),
  definition: socialDefinition
}