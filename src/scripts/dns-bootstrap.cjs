
/**
 * CommunityBond Development DNS Bootstrap
 *
 * PURPOSE:
 * Configure Node.js DNS resolvers before
 * Next.js and Better Auth initialize.
 *
 * WHY:
 * The local Windows DNS resolver is failing
 * MongoDB Atlas SRV lookups.
 *
 * NOTE:
 * Development-only workaround.
 */

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
