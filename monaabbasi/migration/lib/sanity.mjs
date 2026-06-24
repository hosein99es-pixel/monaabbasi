import { apiVersion, projectId, targetDataset } from "../config.mjs";
import { loadCliCore } from "./dependencies.mjs";

export async function getAuthenticatedClient(dataset = targetDataset) {
  const { getGlobalCliClient } = await loadCliCore();
  const client = await getGlobalCliClient({ apiVersion, requireUser: true });
  return client.withConfig({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    useProjectHostname: true,
  });
}

export async function getManagementClient() {
  const { getGlobalCliClient } = await loadCliCore();
  const client = await getGlobalCliClient({ apiVersion, requireUser: true });
  // Dataset mutations are project-hosted in the current @sanity/client API.
  // The global CLI client defaults to api.sanity.io, which omits the project ID
  // from datasets.create() requests and produces "Project ID must be passed".
  return client.withConfig({
    projectId,
    apiVersion,
    useCdn: false,
    useProjectHostname: true,
  });
}
