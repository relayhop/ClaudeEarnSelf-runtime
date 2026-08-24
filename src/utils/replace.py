def replace_all_for_l(text, l):
    if not isinstance(text, str):
        raise ValueError('Text must be a string')
    return text.replace('All', str(l))
