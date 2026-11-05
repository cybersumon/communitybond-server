
const dns = require("node:dns");
const dnsPromises = require("node:dns/promises");

const dnsServers = [
  "1.1.1.1",
  "8.8.8.8",
];

dns.setServers(dnsServers);
dnsPromises.setServers(dnsServers);

console.log(
  "[CommunityBond] DNS configured:",
  dnsPromises.getServers().join(", ")
);
