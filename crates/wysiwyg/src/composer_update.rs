// Copyright 2022 The Matrix.org Foundation C.I.C.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

use crate::{text_update::ReplaceAll, ComposerAction, MenuState, TextUpdate};

#[derive(Debug, Clone)]
pub struct ComposerUpdate {
    pub text_update: TextUpdate,
    pub menu_state: MenuState,
    pub actions: Vec<ComposerAction>,
}

impl ComposerUpdate {
    pub fn keep() -> Self {
        Self {
            text_update: TextUpdate::Keep,
            menu_state: MenuState::None,
            actions: Vec::new(),
        }
    }

    pub fn replace_all(
        replacement_html: String,
        selection_start_codepoint: usize,
        selection_end_codepoint: usize,
    ) -> Self {
        Self {
            text_update: TextUpdate::ReplaceAll(ReplaceAll {
                replacement_html,
                selection_start_codepoint,
                selection_end_codepoint,
            }),
            menu_state: MenuState::None,
            actions: Vec::new(),
        }
    }
}
