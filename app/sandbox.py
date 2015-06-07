#from os import urandom
from random import randint
from time import *
__author__ = 'mlavrynenko'

smal_rsa_primes = [
        2   ,      3    ,     5    ,     7    ,    11  ,      13   ,     17     ,   19,
        23  ,      29   ,     31   ,     37   ,     41 ,       43  ,      47    ,    53,
        59  ,      61   ,     67   ,     71   ,     73 ,       79  ,      83    ,    89,
]

test_primes = [
      6389,      6397,      6421,      6427,      6449,      6451,      6469,      6473,
      6481,      6491,      6521,      6529,      6547,      6551,      6553,      6563,
      6569,      6571,      6577,      6581,      6599,      6607,      6619,      6637,
      6653,      6659,      6661,      6673,      6679,      6689,      6691,      6701,
      6703,      6709,      6719,      6733,      6737,      6761,      6763,      6779,
      6781,      6791,      6793,      6803,      6823,      6827,      6829,      6833,
      6841,      6857,      6863,      6869,      6871,      6883,      6899,      6907]


def gcd(a, b, logging = False):
    while a > 0 and b > 0:
        if logging:
            print("GCD: %s %s" % (a, b))
        if a > b:
            a %= b
        else:
            b %= a
    return a + b

def gcd_extended(a, b):
    if a == 0:
        #print ("%s %s | %s %s" % (a, b, 0, 1))
        return b, 0, 1
    res, x, y = gcd_extended(b % a, a)
    #print ("%s %s | %s %s" % (a, b, x, y))
    tmp = x
    x = y - (b / a) * x
    y = tmp
    return res, x, y


def f1(x):
    return sum([1 for i in range(1, x+1) if gcd(x, i) == 1])


def fact(x):
    limit = pow(x, 0.5)
    divs = []
    d = 2
    while x > 1 and d <= limit:
        if x % d == 0:
            x /= d
            divs.append(d)
        else:
            d += 1
    if x > 1:
        divs.append(x)
    return divs

assert fact(30) == [2, 3, 5]
assert fact(49) == [7, 7]
assert fact(50) == [2, 5, 5]


def find_root(m):
    def pass_test(g, f, m):
        if pow(g, f) % m != 1:
            return False
        for i in range(1, f):
            if pow(g, i) % m == 1:
                return False
        return True

    f = f1(m)
    for t in range(1, m):
        if pass_test(t, f, m):
            return t


def find_root_fast(m):
    phi = f1(m)
    print("Phi is %s" % phi)
    divs = fact(phi)
    print("Divisors is %s" % divs)
    for to_test in range(2, m+1):   # test all number from 2 to m
        flag = True
        for divisor in divs:
            flag &= pow(to_test, phi / divisor, m) != 1
        if flag:
            return to_test


def find_roots(m):
    def pass_test(g, f, m):
        if pow(g, f) % m != 1:
            return False
        for i in range(1, f):
            if pow(g, i) % m == 1:
                return False
        return True
    res = []
    f = f1(m)
    for t in range(1, m):
        if pass_test(t, f, m):
            res.append(t)
    return res


def test_find_root(number, expected):
    root = find_root(number)
    if root != expected:
        raise Exception('Invalid find_root function. Got %s expected %s on number %s' % (root, expected, number))

test_find_root(2, 1)
test_find_root(3, 2)
test_find_root(4, 3)
test_find_root(5, 2)
test_find_root(6, 5)
test_find_root(7, 3)
test_find_root(8, None)
test_find_root(9, 2)
test_find_root(10, 3)
test_find_root(11, 2)
test_find_root(12, None)
test_find_root(13, 2)
test_find_root(14, 3)


def one_party_step(g, p, a):
    return pow(g, a) % p


def do_algo():
    p = 16921 # should be prime number
    g = find_root_fast(p)
    print("P is %d" % p)
    print("g is %d" % g)
    a_power, b_power = 6, 15

    a_response = one_party_step(g, p, a_power)
    b_response = one_party_step(g, p, b_power)

    print("A public is %s" % a_response)
    print("B public is %s" % b_response)

    a_secret = one_party_step(b_response, p, a_power)
    b_secret = one_party_step(a_response, p, b_power)

    print("Common secret is %s for A, and %s for B" % (a_secret, b_secret))


def test_primitive_root_existence():
    print(find_roots(94))
    for i in range(1, 100):
        if find_root(i) is None:
            print i


def test_slow_and_fast_PRM(number):
    print("Test number %s" % number)
    start = time()
    root1 = find_root_fast(number)
    end = time()
    print("Fast result is %s in %s" % (root1, end - start))

    start = time()
    root2 = find_root(number)
    end = time()
    print("Slow result is %s in %s" % (root2, end - start))
    assert root1 == root2


def test_slow_and_fast_PRM_multiple():
    for prime in test_primes:
        test_slow_and_fast_PRM(prime)


def rsa():
    def get_open_exponent(n):
        flag = False
        while not flag:
            d = randint(2, n-1)
            flag = gcd(d, n) == 1
        return d

    def get_private_exponent(e, phi):
        gcd, x, y = gcd_extended(e, phi)
        assert gcd == 1
        return ((x + phi) % phi)

    primes = smal_rsa_primes
    limit = len(primes) - 1
    p = primes[randint(0, limit)]
    q = primes[randint(0, limit)]
    phi = (q - 1) * (p - 1)
    n = p * q # module
    e = get_open_exponent(phi)
    d = get_private_exponent(e, phi)
    print("p and q for RSA is %s %s" % (p, q))
    print("Exponents is %s %s" % (e, d))

    def encrypt(message):
        assert message >= 0 and message < n
        return pow(message, e) % n

    def decrypt(cypher):
        assert cypher >= 0 and cypher < n
        return pow(cypher, d) % n

    return {
        "encrypt": encrypt,
        "decrypt": decrypt,
        "open_key": (e, n),
        "private_key": (d, n)
    }

def gcd_tutorial(a,b):
    res = gcd_extended(a, b)
    print("%s*%s + %s*%s=%s" % (res[1], a, res[2], b, res[0]))

#do_algo()
alg = rsa()
encryted = alg["encrypt"](344 % alg["open_key"][1]) # n can be less then input message
print("Encrypted is %s" % encryted)
decrypted = alg["decrypt"](encryted)
print("Initial is %s" % decrypted)

#test_slow_and_fast_PRM_multiple()
#test_primitive_root_existence()
