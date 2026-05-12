#![no_std]

use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct CounterContract;

#[contractimpl]
impl CounterContract {
    pub fn get(env: Env) -> u32 {
        env.storage().instance().get(&"count").unwrap_or(0)
    }

    pub fn increment(env: Env) -> u32 {
        let count = Self::get(env.clone()) + 1;
        env.storage().instance().set(&"count", &count);
        count
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn increments_counter() {
        let env = Env::default();
        let contract_id = env.register(CounterContract, ());
        let client = CounterContractClient::new(&env, &contract_id);

        assert_eq!(client.get(), 0);
        assert_eq!(client.increment(), 1);
        assert_eq!(client.get(), 1);
    }
}
