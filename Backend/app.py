

def containsNearbyDuplicate(self, nums: List[int], k: int) -> bool:
        a={}
        for i,j in enumerate(nums):
            if j in a:
                val=a.get(j)
                if abs(i-val)<=k:
                    return True
            a[j]=i
        return False

