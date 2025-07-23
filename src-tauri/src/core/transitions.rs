/// Document State Transitions Module
/// 
/// This module contains the logic defining valid state changes for the Document FSM.
/// Enforces the structured workflow: Draft → Memo → PRFAQ → PRD → EpicBreakdown
/// 
/// Key workflow rules:
/// - A Memo can transition to PRFAQ, but not directly to EpicBreakdown
/// - Documents can move backward in the workflow for editing
/// - Any document can be archived or reactivated from archive to Draft

use super::entities::DocumentState;

/// Defines the valid transitions between document states
/// This is the central authority for state transition validation
pub struct DocumentTransitions;

impl DocumentTransitions {
    /// Check if a transition from one state to another is valid
    /// 
    /// # Arguments
    /// * `from` - The current document state
    /// * `to` - The target document state
    /// 
    /// # Returns
    /// * `true` if the transition is valid, `false` otherwise
    /// 
    /// # Examples
    /// ```
    /// use crate::core::transitions::DocumentTransitions;
    /// use crate::core::entities::DocumentState;
    /// 
    /// assert!(DocumentTransitions::is_valid_transition(&DocumentState::Memo, &DocumentState::PRFAQ));
    /// assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Memo, &DocumentState::EpicBreakdown));
    /// ```
    pub fn is_valid_transition(from: &DocumentState, to: &DocumentState) -> bool {
        match (from, to) {
            // Draft can become Memo or be archived
            (DocumentState::Draft, DocumentState::Memo) => true,
            (DocumentState::Draft, DocumentState::Archived) => true,
            
            // Memo can become PRFAQ or go back to Draft for editing
            (DocumentState::Memo, DocumentState::PRFAQ) => true,
            (DocumentState::Memo, DocumentState::Draft) => true,
            (DocumentState::Memo, DocumentState::Archived) => true,
            
            // PRFAQ can become PRD or go back to Memo/Draft
            (DocumentState::PRFAQ, DocumentState::PRD) => true,
            (DocumentState::PRFAQ, DocumentState::Memo) => true,
            (DocumentState::PRFAQ, DocumentState::Draft) => true,
            (DocumentState::PRFAQ, DocumentState::Archived) => true,
            
            // PRD can become EpicBreakdown or go back to previous states
            (DocumentState::PRD, DocumentState::EpicBreakdown) => true,
            (DocumentState::PRD, DocumentState::PRFAQ) => true,
            (DocumentState::PRD, DocumentState::Memo) => true,
            (DocumentState::PRD, DocumentState::Draft) => true,
            (DocumentState::PRD, DocumentState::Archived) => true,
            
            // EpicBreakdown can go back to any previous state or be archived
            (DocumentState::EpicBreakdown, DocumentState::PRD) => true,
            (DocumentState::EpicBreakdown, DocumentState::PRFAQ) => true,
            (DocumentState::EpicBreakdown, DocumentState::Memo) => true,
            (DocumentState::EpicBreakdown, DocumentState::Draft) => true,
            (DocumentState::EpicBreakdown, DocumentState::Archived) => true,
            
            // Archived documents can be reactivated to Draft
            (DocumentState::Archived, DocumentState::Draft) => true,
            
            // Same state transitions are always valid (no-op)
            (state, target) if state == target => true,
            
            // All other transitions are invalid
            _ => false,
        }
    }

    /// Get all valid next states from the current state
    /// 
    /// # Arguments
    /// * `current_state` - The current document state
    /// 
    /// # Returns
    /// * A vector of all valid next states
    pub fn get_valid_transitions(current_state: &DocumentState) -> Vec<DocumentState> {
        match current_state {
            DocumentState::Draft => vec![
                DocumentState::Memo,
                DocumentState::Archived,
            ],
            DocumentState::Memo => vec![
                DocumentState::PRFAQ,
                DocumentState::Draft,
                DocumentState::Archived,
            ],
            DocumentState::PRFAQ => vec![
                DocumentState::PRD,
                DocumentState::Memo,
                DocumentState::Draft,
                DocumentState::Archived,
            ],
            DocumentState::PRD => vec![
                DocumentState::EpicBreakdown,
                DocumentState::PRFAQ,
                DocumentState::Memo,
                DocumentState::Draft,
                DocumentState::Archived,
            ],
            DocumentState::EpicBreakdown => vec![
                DocumentState::PRD,
                DocumentState::PRFAQ,
                DocumentState::Memo,
                DocumentState::Draft,
                DocumentState::Archived,
            ],
            DocumentState::Archived => vec![
                DocumentState::Draft,
            ],
        }
    }

    /// Get the next logical state in the workflow progression
    /// Returns None if the current state is at the end of the workflow
    /// 
    /// # Arguments
    /// * `current_state` - The current document state
    /// 
    /// # Returns
    /// * `Some(DocumentState)` for the next state in progression, `None` if at the end
    pub fn get_next_workflow_state(current_state: &DocumentState) -> Option<DocumentState> {
        match current_state {
            DocumentState::Draft => Some(DocumentState::Memo),
            DocumentState::Memo => Some(DocumentState::PRFAQ),
            DocumentState::PRFAQ => Some(DocumentState::PRD),
            DocumentState::PRD => Some(DocumentState::EpicBreakdown),
            DocumentState::EpicBreakdown => None, // End of workflow
            DocumentState::Archived => None, // Archived documents don't progress
        }
    }

    /// Get the previous logical state in the workflow progression
    /// Returns None if the current state is at the beginning of the workflow
    /// 
    /// # Arguments
    /// * `current_state` - The current document state
    /// 
    /// # Returns
    /// * `Some(DocumentState)` for the previous state in progression, `None` if at the beginning
    pub fn get_previous_workflow_state(current_state: &DocumentState) -> Option<DocumentState> {
        match current_state {
            DocumentState::Draft => None, // Beginning of workflow
            DocumentState::Memo => Some(DocumentState::Draft),
            DocumentState::PRFAQ => Some(DocumentState::Memo),
            DocumentState::PRD => Some(DocumentState::PRFAQ),
            DocumentState::EpicBreakdown => Some(DocumentState::PRD),
            DocumentState::Archived => None, // Archived documents don't have a previous state
        }
    }

    /// Check if a state is a terminal state (end of workflow)
    /// 
    /// # Arguments
    /// * `state` - The document state to check
    /// 
    /// # Returns
    /// * `true` if the state is terminal, `false` otherwise
    pub fn is_terminal_state(state: &DocumentState) -> bool {
        matches!(state, DocumentState::EpicBreakdown | DocumentState::Archived)
    }

    /// Check if a state is an initial state (beginning of workflow)
    /// 
    /// # Arguments
    /// * `state` - The document state to check
    /// 
    /// # Returns
    /// * `true` if the state is initial, `false` otherwise
    pub fn is_initial_state(state: &DocumentState) -> bool {
        matches!(state, DocumentState::Draft)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_forward_transitions() {
        // Test the main workflow progression
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::Draft, &DocumentState::Memo));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::Memo, &DocumentState::PRFAQ));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRFAQ, &DocumentState::PRD));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRD, &DocumentState::EpicBreakdown));
    }

    #[test]
    fn test_invalid_forward_transitions() {
        // Test invalid direct transitions (skipping states)
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Draft, &DocumentState::PRFAQ));
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Draft, &DocumentState::PRD));
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Draft, &DocumentState::EpicBreakdown));
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Memo, &DocumentState::PRD));
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Memo, &DocumentState::EpicBreakdown));
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::PRFAQ, &DocumentState::EpicBreakdown));
    }

    #[test]
    fn test_valid_backward_transitions() {
        // Test backward transitions for editing
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRFAQ, &DocumentState::Memo));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRD, &DocumentState::PRFAQ));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::EpicBreakdown, &DocumentState::PRD));
        
        // Test transitions back to Draft from any state
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::Memo, &DocumentState::Draft));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRFAQ, &DocumentState::Draft));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRD, &DocumentState::Draft));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::EpicBreakdown, &DocumentState::Draft));
    }

    #[test]
    fn test_archive_transitions() {
        // Test archiving from any state
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::Draft, &DocumentState::Archived));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::Memo, &DocumentState::Archived));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRFAQ, &DocumentState::Archived));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRD, &DocumentState::Archived));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::EpicBreakdown, &DocumentState::Archived));
        
        // Test reactivation from archive
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::Archived, &DocumentState::Draft));
        
        // Test invalid transitions from archive (can only go to Draft)
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Archived, &DocumentState::Memo));
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Archived, &DocumentState::PRFAQ));
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Archived, &DocumentState::PRD));
        assert!(!DocumentTransitions::is_valid_transition(&DocumentState::Archived, &DocumentState::EpicBreakdown));
    }

    #[test]
    fn test_same_state_transitions() {
        // Test that same-state transitions are always valid (no-op)
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::Draft, &DocumentState::Draft));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::Memo, &DocumentState::Memo));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRFAQ, &DocumentState::PRFAQ));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::PRD, &DocumentState::PRD));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::EpicBreakdown, &DocumentState::EpicBreakdown));
        assert!(DocumentTransitions::is_valid_transition(&DocumentState::Archived, &DocumentState::Archived));
    }

    #[test]
    fn test_workflow_progression() {
        assert_eq!(DocumentTransitions::get_next_workflow_state(&DocumentState::Draft), Some(DocumentState::Memo));
        assert_eq!(DocumentTransitions::get_next_workflow_state(&DocumentState::Memo), Some(DocumentState::PRFAQ));
        assert_eq!(DocumentTransitions::get_next_workflow_state(&DocumentState::PRFAQ), Some(DocumentState::PRD));
        assert_eq!(DocumentTransitions::get_next_workflow_state(&DocumentState::PRD), Some(DocumentState::EpicBreakdown));
        assert_eq!(DocumentTransitions::get_next_workflow_state(&DocumentState::EpicBreakdown), None);
        assert_eq!(DocumentTransitions::get_next_workflow_state(&DocumentState::Archived), None);
    }

    #[test]
    fn test_workflow_regression() {
        assert_eq!(DocumentTransitions::get_previous_workflow_state(&DocumentState::Draft), None);
        assert_eq!(DocumentTransitions::get_previous_workflow_state(&DocumentState::Memo), Some(DocumentState::Draft));
        assert_eq!(DocumentTransitions::get_previous_workflow_state(&DocumentState::PRFAQ), Some(DocumentState::Memo));
        assert_eq!(DocumentTransitions::get_previous_workflow_state(&DocumentState::PRD), Some(DocumentState::PRFAQ));
        assert_eq!(DocumentTransitions::get_previous_workflow_state(&DocumentState::EpicBreakdown), Some(DocumentState::PRD));
        assert_eq!(DocumentTransitions::get_previous_workflow_state(&DocumentState::Archived), None);
    }

    #[test]
    fn test_terminal_states() {
        assert!(!DocumentTransitions::is_terminal_state(&DocumentState::Draft));
        assert!(!DocumentTransitions::is_terminal_state(&DocumentState::Memo));
        assert!(!DocumentTransitions::is_terminal_state(&DocumentState::PRFAQ));
        assert!(!DocumentTransitions::is_terminal_state(&DocumentState::PRD));
        assert!(DocumentTransitions::is_terminal_state(&DocumentState::EpicBreakdown));
        assert!(DocumentTransitions::is_terminal_state(&DocumentState::Archived));
    }

    #[test]
    fn test_initial_states() {
        assert!(DocumentTransitions::is_initial_state(&DocumentState::Draft));
        assert!(!DocumentTransitions::is_initial_state(&DocumentState::Memo));
        assert!(!DocumentTransitions::is_initial_state(&DocumentState::PRFAQ));
        assert!(!DocumentTransitions::is_initial_state(&DocumentState::PRD));
        assert!(!DocumentTransitions::is_initial_state(&DocumentState::EpicBreakdown));
        assert!(!DocumentTransitions::is_initial_state(&DocumentState::Archived));
    }
}
