from app.services.omni_service import _enrich_prompt


def test_no_dialogue_explicitly_excludes_speech():
    prompt = _enrich_prompt('A product on a houseboat', dialogue='   ')
    assert 'No spoken dialogue or voice-over' in prompt


def test_spoken_line_does_not_receive_silence_instruction():
    prompt = _enrich_prompt('A product on a houseboat', dialogue='Hello Maya', language='en')
    assert 'Hello Maya' in prompt
    assert 'No spoken dialogue' not in prompt
