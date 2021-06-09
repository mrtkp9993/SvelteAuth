<script>
	import {onMount} from "svelte";
	import auth from "./authService";
	import {isAuthenticated, user} from "./store";
	import { Col, Container, Row } from 'sveltestrap';
	import {Nav, Navbar, NavbarBrand, NavItem, NavLink} from 'sveltestrap';
	import { Alert } from 'sveltestrap';

	let auth0Client;

	onMount(async () => {
		auth0Client = await auth.createClient();

		isAuthenticated.set(await auth0Client.isAuthenticated());
		user.set(await auth0Client.getUser());
	});

	function login() {
		auth.login(auth0Client);
	}

	function logout() {
		auth.logout(auth0Client);
	}
</script>

<main>
	<head>
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.1/dist/css/bootstrap.min.css">
	</head>
	<Container>
		<Row>
			<Col>
				<Navbar color="danger" dark expand="md">
					<NavbarBrand href="/">SvelteDashboard</NavbarBrand>
					<Nav class="ms-auto" navbar>
						<NavItem>
							{#if $isAuthenticated}
								<NavLink on:click={logout}>Log Out</NavLink>
							{:else}
								<NavLink on:click={login}>Log In</NavLink>
							{/if}
						</NavItem>
					</Nav>
				</Navbar>
				<Row>
					<Col>
						<br>
					</Col>
				</Row>
					<Row>
						<Col>
							{#if !$isAuthenticated}
								<Alert color="secondary"><p>Please login to see dashboard.</p>
								</Alert>
							{:else}
								<p>hello world.</p>
							{/if}
						</Col>
					</Row>
			</Col>
		</Row>
	</Container>
</main>

<style>
</style>