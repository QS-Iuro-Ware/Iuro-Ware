use actix::prelude::*;
use rand::{distributions::Standard, prelude::*};
use std::collections::HashMap;

use crate::{games, prelude::*};

const EXPECTED_USERS: usize = 4;

/// User's data when inside of a room
pub struct RoomSlot {
    pub recipient: Recipient<Broadcast>,
    pub name: String,
    pub wins: usize,
}

/// Manages room's users and its games
pub struct Room {
    sessions: HashMap<usize, RoomSlot>,
    games: Vec<Game>,
    game: Option<GameState>,
}

impl Default for Room {
    fn default() -> Self {
        Self {
            sessions: HashMap::default(),
            game: None,
            games: (0..10).map(|_| random()).collect(),
        }
    }
}

impl Room {
    /// Inserts user in room if there is space, broadcasts next game if join triggered it
    pub fn join(&mut self, id: usize, slot: RoomSlot) -> JoinResult {
        if self.sessions.len() == EXPECTED_USERS {
            return JoinResult::Full;
        }

        self.sessions.insert(id, slot);

        if self.sessions.len() == EXPECTED_USERS {
            JoinResult::NewGame(self.start_game())
        } else {
            debug!("User {} of {} joined", self.sessions.len(), EXPECTED_USERS);
            JoinResult::NoGame
        }
    }

    /// Instantiates next game in queue
    pub fn start_game(&mut self) -> Game {
        let game = self.games.remove(0);
        self.games.push(random());

        self.game = Some(match game.clone() {
            Game::RockPapiuroScissor => GameState::RockPapiuroScissor(HashMap::default()),
            Game::TheRightIuro(state) => GameState::TheRightIuro((state, Default::default()))
        });

        game
    }

    /// Updates game state with user's input
    pub fn update(
        &mut self,
        user_id: usize,
        input: GameInput,
    ) -> Result<(&'static str, HashMap<String, usize>), IuroError> {
        let name;
        let has_ended = match (self.game.as_mut(), &input) {
            (Some(GameState::RockPapiuroScissor(state)), GameInput::RockPapiuroScissor(input)) => {
                let update = games::rock_papiuro_scissor::Update {
                    user_id,
                    input: *input,
                    state,
                };
                name = "RockPapiuroScissor";
                update.consume(&mut self.sessions)?
            }
            (Some(GameState::TheRightIuro(state)), GameInput::TheRightIuro(input)) => {
                let update = games::the_right_iuro::Update {
                    user_id,
                    input: input.clone(),
                    state,
                };
                name = "TheRightIuro";
                update.consume(&mut self.sessions)?
            }
            (None, _) => {
                warn!("User sent game input when it wasn't possible");
                return Err(IuroError::NoGameRunning);
            }
            _ => {
                warn!("User sent game input when it wasn't possible");
                return Err(IuroError::InvalidGame);
            }
        };

        if has_ended {
            // If game has ended
            Ok((name, self
                .sessions
                .values()
                .map(|slot| (slot.name.clone(), slot.wins))
                .collect()))
        } else {
            // Nobody won yet
            Ok((name, HashMap::default()))
        }
    }

    pub fn sessions(&self) -> &HashMap<usize, RoomSlot> {
        &self.sessions
    }

    pub fn sessions_mut(&mut self) -> &mut HashMap<usize, RoomSlot> {
        &mut self.sessions
    }

    pub fn remove_session(&mut self, id: usize) -> Option<RoomSlot> {
        self.sessions.remove(&id)
    }

    pub fn reset_game(&mut self) {
        self.game = None;
    }
}

impl Distribution<Game> for Standard {
    fn sample<R: Rng + ?Sized>(&self, rng: &mut R) -> Game {
        let game = match rng.gen_range(0, 2) {
            0 => Game::RockPapiuroScissor,
            _ => {
                let mut values = Vec::with_capacity(8);
                while values.len() < 8 {
                    let value = rng.gen_range(0, 36);
                    if !values.contains(&value) {
                        values.push(value);
                    }
                }
                Game::TheRightIuro(values)
            }
        };

        // This is here so the code breaks whenever new variants are added,
        // since the random generation above will only break silently at runtime
        match game {
            Game::RockPapiuroScissor => game,
            game @ Game::TheRightIuro(_) => game,
        }
    }
}

/// Possible results of trying to join a room
pub enum JoinResult {
    /// User joining triggered game start
    NewGame(Game),
    /// User joined, but game is not ready to start yet
    NoGame,
    /// Can't join room since it's already full
    Full,
}
