import createAuth0Client from "@auth0/auth0-spa-js";
import {user, isAuthenticated, popUpOpen} from "./store";
import config from "./authconfig";

async function createClient() {
    let auth0Client = await createAuth0Client({
        domain: config.domain,
        client_id: config.clientId
    });

    return auth0Client;
}

async function login(client, opts) {
    popUpOpen.set(true);
    try {
        await client.loginWithPopup(opts);

        user.set(await client.getUser());
        isAuthenticated.set(true);
    } catch (e) {
        console.error(e);
    } finally {
        popUpOpen.set(false);
    }
}

function logout(client) {
    return client.logout();
}

const auth = {
    createClient,
    login,
    logout
};

export default auth;
