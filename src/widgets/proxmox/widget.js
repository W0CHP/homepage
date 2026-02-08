import credentialedProxyHandler from "utils/proxy/handlers/credentialed";

const widget = {
  api: "{url}/api2/json/{endpoint}",
  proxyHandler: credentialedProxyHandler,

  mappings: {
    resources: {
      endpoint: "cluster/resources",
      validate: ["data"],
    },
  },
};

export default widget;
